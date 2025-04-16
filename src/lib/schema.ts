// Supabaseテーブルスキーマ定義

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface NewContact {
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read?: boolean;
}

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: Contact;
        Insert: NewContact;
        Update: Partial<NewContact>;
      };
      // 他のテーブルの定義もここに追加可能
    };
  };
} 