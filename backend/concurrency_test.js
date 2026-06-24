/**
 * Concurrency Test Script
 * Runs inside the Node.js backend container to simulate multiple users 
 * concurrently attempting to book the exact same seat.
 */

const BACKEND_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- STARTING CONCURRENCY LOCKING TEST ---');

  // 1. Create a helper for fetch requests
  const post = async (path, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  const get = async (path, token = null) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BACKEND_URL}${path}`, { headers });
    return { status: res.status, data: await res.json() };
  };

  try {
    // 2. Register & Login 5 test users in parallel
    console.log('Registering and logging in 5 test users...');
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const email = `testuser_${Date.now()}_${i}@example.com`;
      const password = 'Password123!';
      const name = `Test User ${i}`;

      // Register
      await post('/auth/register', { name, email, password });
      
      // Login to get token
      const loginRes = await post('/auth/login', { email, password });
      if (loginRes.status === 200) {
        users.push({
          id: loginRes.data.user.id,
          token: loginRes.data.token,
          name
        });
      }
    }
    console.log(`Successfully logged in ${users.length} users.`);

    if (users.length < 5) {
      throw new Error('Failed to register/login all 5 test users.');
    }

    // 3. Fetch events list and get first event
    const eventsRes = await get('/events');
    if (eventsRes.status !== 200 || eventsRes.data.length === 0) {
      throw new Error('Failed to fetch events list.');
    }
    const event = eventsRes.data[0];
    console.log(`Selected event for test: "${event.title}"`);

    // 4. Fetch seat layout to get the first available seat ID
    const seatsRes = await get(`/events/${event.id}/seats`);
    if (seatsRes.status !== 200 || seatsRes.data.length === 0) {
      throw new Error('Failed to fetch seats.');
    }
    
    const availableSeat = seatsRes.data.find(s => s.status === 'available');
    if (!availableSeat) {
      throw new Error('No available seats found to test concurrency!');
    }
    console.log(`Selected seat for concurrency booking conflict: Seat "${availableSeat.seat_number}" (ID: ${availableSeat.id})`);

    // 5. Send 5 simultaneous requests to BOOK this exact seat (bypassing Redis reservation to test Postgres transaction row-locking)
    console.log('Firing 5 simultaneous booking requests for the same seat...');
    const bookingPromises = users.map(user => 
      post('/bookings/book', {
        eventId: event.id,
        seatIds: [availableSeat.id]
      }, user.token)
    );

    const results = await Promise.all(bookingPromises);

    // 6. Analyze results
    console.log('\n--- Test Results Summary ---');
    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;

    results.forEach((res, index) => {
      const userName = users[index].name;
      if (res.status === 200) {
        successCount++;
        console.log(`✅ [SUCCESS] User "${userName}" successfully booked the seat. Booking ID: ${res.data.bookingId}`);
      } else if (res.status === 409) {
        conflictCount++;
        console.log(`❌ [CONFLICT] User "${userName}" booking rejected with 409 Conflict. Error: "${res.data.error}"`);
      } else {
        otherCount++;
        console.log(`❓ [OTHER] User "${userName}" request returned status ${res.status}. Data:`, res.data);
      }
    });

    console.log('----------------------------');
    console.log(`Successful Bookings: ${successCount}`);
    console.log(`Rejected Conflict Bookings: ${conflictCount}`);
    
    // Validate assertions
    if (successCount === 1 && conflictCount === 4) {
      console.log('\n🎉 CONCURRENCY LOCK TEST PASSED SUCCESSFULLY!');
      console.log('MySQL transaction-level row locking ("SELECT FOR UPDATE") correctly prevented double-booking of the seat.');
    } else {
      console.log('\n⚠️ CONCURRENCY LOCK TEST FAILED!');
      console.log(`Expected: 1 success and 4 conflicts. Got: ${successCount} success and ${conflictCount} conflicts.`);
    }

  } catch (err) {
    console.error('Error running concurrency test:', err.message);
  }
}

// Start test after a small delay
setTimeout(runTest, 1000);
