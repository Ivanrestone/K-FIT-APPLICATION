// Supabase connection settings for the K-FIT attendance kiosk.
// Uses the service role key so no login is required on the Pi.
module.exports = {
  SUPABASE_URL: 'https://ahicsoctvqxcutjbvnfl.supabase.co',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaWNzb2N0dnF4Y3V0amJ2bmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NjIzNTAsImV4cCI6MjEwODMzODM1MH0.gYOSOOS5nssqEsvY9M1I91QJfHyxqocH0duS2PnkdTc',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaWNzb2N0dnF4Y3V0amJ2bmZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc2MjM1MCwiZXhwIjoyMTA4MzM4MzUwfQ.L2c0D6McmaJ2uuToppfA5PUwVljq8q5cJPTO86azQ5Y',
  PORT: 3000,
  REFRESH_MS: 10000, // how often the page polls for new data
};
