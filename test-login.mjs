
const supabaseUrl = 'https://ebykvadibugpvabjunez.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieWt2YWRpYnVncHZhYmp1bmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTUyNTMsImV4cCI6MjA5NzMzMTI1M30.-zBIAU3duYp4RIDSQchbRciWXhCQN5pW071i9mGR3v0';

async function test() {
  const randomEmail = `test-user-${Math.floor(Math.random() * 100000)}@gmail.com`;
  console.log(`Testing sign-up for ${randomEmail}...`);
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: randomEmail,
        password: 'password123',
      }),
    });

    const data = await res.json();
    console.log('Status Code:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
