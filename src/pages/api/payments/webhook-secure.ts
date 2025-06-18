import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import getRawBody from 'raw-body';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { withRateLimit, paymentRateLimit } from '../../../lib/security/rate-limiter';
import { withErrorHandler, SecurityError, withSecurityHeaders } from '../../../lib/security/error-handler';
import { validateRequest, uuidSchema } from '../../../lib/security/validation';
import crypto from 'crypto';

// Disable body parser for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};

// Event processing status tracking
const processedEvents = new Set<string>();

// Clean up old processed events every hour
setInterval(() => {
  processedEvents.clear();
}, 60 * 60 * 1000);

// Verify webhook signature
const verifyWebhookSignature = (body: Buffer, signature: string, secret: string): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new SecurityError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
  }
};

// Validate event data
const validateEventData = (event: Stripe.Event): void => {
  if (!event.id || !event.type || !event.data) {
    throw new SecurityError('Invalid event structure', 400, 'INVALID_EVENT');
  }

  // Check event age (reject events older than 5 minutes)
  const eventTime = new Date(event.created * 1000);
  const now = new Date();
  const ageInMinutes = (now.getTime() - eventTime.getTime()) / (1000 * 60);
  
  if (ageInMinutes > 5) {
    throw new SecurityError('Event too old', 400, 'EVENT_EXPIRED');
  }
};

// Idempotency check
const checkIdempotency = (eventId: string): boolean => {
  if (processedEvents.has(eventId)) {
    return false;
  }
  processedEvents.add(eventId);
  return true;
};

// Secure database operations with transaction
const updatePaymentStatus = async (
  paymentIntentId: string, 
  status: string, 
  metadata?: any
): Promise<void> => {
  try {
    // Validate payment intent ID
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      throw new Error('Invalid payment intent ID');
    }

    const { error } = await supabaseAdmin
      .from('payments')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(metadata && { metadata })
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error('Database update error:', error);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }

  } catch (error) {
    console.error('Payment status update failed:', error);
    throw error;
  }
};

// Create purchase record with validation
const createPurchaseRecord = async (
  userId: string,
  promptId: string,
  paymentIntentId: string,
  checkoutSessionId?: string
): Promise<void> => {
  try {
    // Validate UUIDs
    validateRequest(uuidSchema, userId);
    validateRequest(uuidSchema, promptId);

    // Check for existing purchase (idempotency)
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .maybeSingle();

    if (existingPurchase) {
      return;
    }

    // Verify prompt exists and get price
    const { data: prompt, error: promptError } = await supabaseAdmin
      .from('prompts')
      .select('id, price, user_id')
      .eq('id', promptId)
      .single();

    if (promptError || !prompt) {
      throw new Error('Prompt not found');
    }

    // Prevent self-purchase
    if (prompt.user_id === userId) {
      throw new Error('Cannot purchase own prompt');
    }

    // Create purchase record
    const { error: insertError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        payment_intent_id: paymentIntentId,
        checkout_session_id: checkoutSessionId,
        amount: prompt.price,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create purchase record: ${insertError.message}`);
    }

  } catch (error) {
    console.error('Purchase record creation failed:', error);
    throw error;
  }
};

// Handle payment intent succeeded
const handlePaymentIntentSucceeded = async (event: Stripe.Event): Promise<void> => {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  
  try {
    await updatePaymentStatus(paymentIntent.id, 'succeeded');

    // Process purchase if metadata is available
    const metadata = paymentIntent.metadata;
    if (metadata?.prompt_id && metadata?.user_id) {
      await createPurchaseRecord(
        metadata.user_id,
        metadata.prompt_id,
        paymentIntent.id
      );
    } else {
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
};

// Handle payment intent failed
const handlePaymentIntentFailed = async (event: Stripe.Event): Promise<void> => {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  
  try {
    await updatePaymentStatus(paymentIntent.id, 'failed', {
      failure_reason: paymentIntent.last_payment_error?.message
    });
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
};

// Handle checkout session completed
const handleCheckoutSessionCompleted = async (event: Stripe.Event): Promise<void> => {
  const session = event.data.object as Stripe.Checkout.Session;
  
  
  if (!session.id) {
    throw new Error('Session ID is missing');
  }
  
  try {
    const paymentIntentId = session.payment_intent as string;
    const metadata = session.metadata || {};
    
    // Update payment status
    await updatePaymentStatus(paymentIntentId, 'paid');

    // Create purchase record if metadata is available
    if (metadata.user_id && metadata.prompt_id) {
      await createPurchaseRecord(
        metadata.user_id,
        metadata.prompt_id,
        paymentIntentId,
        session.id
      );
    } else {
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
};

// Main webhook handler
const webhookHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  // Apply security headers
  withSecurityHeaders(res);

  if (req.method !== 'POST') {
    throw new SecurityError('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  try {
    // Get raw body and signature
    const body = await getRawBody(req, { limit: '1mb' });
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      throw new SecurityError('Missing Stripe signature', 400, 'MISSING_SIGNATURE');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new SecurityError('Webhook secret not configured', 500, 'CONFIG_ERROR');
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, webhookSecret);
    
    // Validate event
    validateEventData(event);
    
    // Check idempotency
    if (!checkIdempotency(event.id)) {
      return res.status(200).json({ received: true, message: 'Event already processed' });
    }


    // Process event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
        
      default:
    }

    // Log successful processing
    
    res.status(200).json({ 
      received: true, 
      eventId: event.id,
      eventType: event.type 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
};

// Export with middleware
export default withRateLimit(
  paymentRateLimit,
  withErrorHandler(webhookHandler)
);