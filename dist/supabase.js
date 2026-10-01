import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const db = createClient(
  'https://niedmgyyougvgiiuwcvw.supabase.co',
  'sb_publishable_7PrmP1V4enFECw0jfTAiDw_XAXD-xqd',
  { auth: { flowType: 'pkce', detectSessionInUrl: true } }
);
