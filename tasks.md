以下のタスクを全てこなし実装前に修正.txtに実装するものをチェックリストでくわえ終えたらチェックしていき間違えが起こらないように進行してくださ。

・スマホ画面の時の検索結果ページのトップマージンが空きすぎているからそこをせばめて

・以下のテーブルを参考にして管理画面でフィードバックも表示されるようにして
create table public.feedback (
  id uuid not null default gen_random_uuid (),
  feedback_type text not null,
  email text null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint feedback_pkey primary key (id)
) TABLESPACE pg_default;

・全画面の背景の色を明るい白に変えてください

追加タスク

・イイねの表示が０になってしまっているのでそこを修正してくださ。