const assert = require('assert');
const http = require('http');
const app = require('../src/app');

async function runEndToEndSimulation() {
  console.log('===========================================================');
  console.log('🔄 SIMULATING END-TO-END RESCUE LIFECYCLE (PROTOTYPE DEMO)');
  console.log('===========================================================\n');

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok', 'Health check should be ok');
    console.log('Step 1: Backend Health Check -> OK');

    // 2. Citizen Submits Rescue Report
    const reportPayload = {
      animalType: 'dog',
      description: 'Dog hit by vehicle on Indiranagar 100ft road, severe bleeding and fracture',
      latitude: 12.9784,
      longitude: 77.6408,
      address: '100 Feet Rd, Indiranagar, Bengaluru',
      reporterName: 'Aditya (Citizen)',
      reporterPhone: '9888877776',
    };

    console.log('\nStep 2: Citizen submitting rescue report...');
    const reportRes = await fetch(`${baseUrl}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload),
    });

    const reportData = await reportRes.json();
    console.log('Report Response:', {
      success: reportData.success,
      urgency: reportData.case?.urgency,
      guidance: reportData.guidance,
      status: reportData.case?.status,
    });

    assert(reportData.success, 'Report submission should succeed');
    assert(reportData.case, 'Case document must be returned');
    assert.strictEqual(reportData.case.urgency, 'HIGH', 'Severe accident should be triaged as HIGH urgency');
    assert(reportData.guidance.length > 5, 'Citizen safety guidance must be returned');

    const caseId = reportData.case._id;

    // 3. Rescuer Accepts Case
    console.log(`\nStep 3: Rescuer accepting case ${caseId}...`);
    const acceptRes = await fetch(`${baseUrl}/dispatch/${caseId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rescuerId: '66f00112233445566778899a' }),
    });

    const acceptData = await acceptRes.json();
    console.log('Accept Response Status:', acceptData.case?.status || acceptData.message);

    // 4. Rescuer Updates Status: On the way -> Animal Picked up -> Completed
    const stages = [
      { status: 'on_the_way', note: 'Rescuer en route with trauma kit' },
      { status: 'reached_location', note: 'Arrived at Indiranagar location' },
      { status: 'animal_picked_up', note: 'Dog safely stabilized and placed in ambulance' },
      { status: 'at_shelter', note: 'Reached CUPA Trauma Centre' },
      {
        status: 'completed',
        note: 'Fracture stabilized and wound dressed',
        medicalNotes: 'Closed fracture set, laceration sutured, rabies booster administered',
        treatment: 'Admitted to CARE Veterinary Ward for 2-week observation',
      },
    ];

    console.log('\nStep 4: Progressing rescue lifecycle stages...');
    let finalUpdate = null;
    for (const stage of stages) {
      const updateRes = await fetch(`${baseUrl}/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stage),
      });
      finalUpdate = await updateRes.json();
      console.log(`  ➔ Status updated to: ${stage.status.toUpperCase()} (${updateRes.status})`);
      assert(updateRes.ok, `Status update to ${stage.status} should succeed`);
    }

    // 5. Verify Animal Profile & QR Code Generated on Complete
    console.log('\nStep 5: Verifying permanent digital animal record and QR code...');
    assert(finalUpdate.animal, 'Completed case must generate an Animal digital profile');
    assert(finalUpdate.animal.qrCodeData, 'Animal profile must contain Base64 QR code data');
    console.log('  QR Code generated length:', finalUpdate.animal.qrCodeData.length, 'bytes');

    // 6. Public QR Scan Lookup
    console.log('\nStep 6: Testing public collar QR scan lookup...');
    const qrLookupRes = await fetch(`${baseUrl}/animals/qr/${caseId}`);
    const qrLookupData = await qrLookupRes.json();
    console.log('  Lookup Result:', {
      name: qrLookupData.animal?.name,
      animalType: qrLookupData.animal?.animalType,
      medicalNotes: qrLookupData.animal?.medicalNotes,
      status: qrLookupData.animal?.status,
    });
    assert(qrLookupData.success, 'QR scan lookup must find animal record');
    assert.strictEqual(qrLookupData.animal.animalType, 'dog');

    // 7. Verify Emergency Contacts
    console.log('\nStep 7: Verifying Bengaluru emergency contacts...');
    const contactsRes = await fetch(`${baseUrl}/contacts`);
    const contactsData = await contactsRes.json();
    console.log(`  Found ${contactsData.count} verified Bengaluru rescue helplines and shelters`);
    assert(contactsData.count >= 7, 'Should have complete directory');

    console.log('\n===========================================================');
    console.log('🎉 END-TO-END PROTOTYPE WORKFLOW SIMULATED WITH 100% SUCCESS');
    console.log('===========================================================\n');
  } finally {
    server.close();
  }
}

runEndToEndSimulation().catch((err) => {
  console.error('❌ End-to-end simulation failed:', err);
  process.exit(1);
});
