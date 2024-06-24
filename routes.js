const express = require('express');
const axios = require('axios');
const { firestore, auth } = require('./firebaseAdmin');
const router = express.Router();

// Function to get district name using Nominatim
async function getDistrictName(latitude, longitude) {
  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
  const response = await axios.get(nominatimUrl);

  if (response.data && response.data.address && response.data.address.city) {
    return response.data.address.city;
  } else if (response.data && response.data.address && response.data.address.town) {
    return response.data.address.town;
  } else if (response.data && response.data.address && response.data.address.village) {
    return response.data.address.village;
  } else {
    return 'Unknown District';
  }
}

// Register Farmer
router.post('/registerFarmer', async (req, res) => {
  const farmer = req.body;
  console.log('Register Farmer Request:', farmer);

  try {
    // Ensure phone number is in E.164 format
    if (farmer.phoneNumber.startsWith('07')) {
      farmer.phoneNumber = `+256${farmer.phoneNumber.substring(1)}`;
    }

    // Get district name using Nominatim
    const districtName = await getDistrictName(farmer.latitude, farmer.longitude);
    console.log('District Name Retrieved:', districtName);

    const user = await auth.createUser({
      phoneNumber: farmer.phoneNumber,
    });
    console.log('Firebase Auth User Created:', user);

    farmer.farmerID = user.uid;

    // Add role_name, role_id, and district_name to farmer object
    const farmerData = {
      ...farmer,
      role_name: 'farmer',
      role_id: 6,
      district_name: districtName,
    };

    await firestore.collection('farmers').doc(farmer.farmerID).set(farmerData);
    console.log('Farmer Document Added to Firestore:', farmerData);

    res.status(201).send(farmerData);
  } catch (e) {
    console.error('Error Registering Farmer:', e);
    res.status(500).send({ error: 'Failed to register farmer', details: e.message });
  }
});

// Register Farm
router.post('/registerFarm', async (req, res) => {
  const farm = req.body;
  console.log('Register Farm Request:', farm);

  try {
    await firestore.collection('farms').doc(farm.farmerID).set(farm);
    console.log('Farm Document Added to Firestore:', farm);

    res.status(201).send(farm);
  } catch (e) {
    console.error('Error Registering Farm:', e);
    res.status(500).send({ error: 'Failed to register farm', details: e.message });
  }
});

// Fetch Farm Data by Farmer ID
router.post('/fetchFarm', async (req, res) => {
    const { farmerID } = req.body;
    console.log('Fetch Farm Request for Farmer ID:', farmerID);
  
    try {
      const farmDoc = await firestore.collection('farms').doc(farmerID).get();
  
      if (farmDoc.exists) {
        const farmData = farmDoc.data();
        console.log('Farm Document Retrieved from Firestore:', farmData);
        res.status(200).send(farmData);
      } else {
        console.log('Farm Not Found in Firestore');
        res.status(404).send({ error: 'Farm not found' });
      }
    } catch (e) {
      console.error('Error Fetching Farm Data:', e);
      res.status(500).send({ error: 'Failed to fetch farm data', details: e.message });
    }
  });  

// Authenticate User
router.post('/authenticateUser', async (req, res) => {
  const { phoneNumber } = req.body;
  console.log('Authenticate User Request:', phoneNumber);

  try {
    // Ensure phone number is in E.164 format
    let formattedPhoneNumber = phoneNumber;
    if (formattedPhoneNumber.startsWith('07')) {
      formattedPhoneNumber = `+256${formattedPhoneNumber.substring(1)}`;
    }

    const userRecord = await auth.getUserByPhoneNumber(formattedPhoneNumber);
    console.log('Firebase Auth User Retrieved:', userRecord);

    const doc = await firestore.collection('farmers').doc(userRecord.uid).get();

    if (doc.exists) {
      const user = doc.data();
      console.log('User Document Retrieved from Firestore:', user);

      // Generate a custom token for the user
      const token = await auth.createCustomToken(userRecord.uid);
      console.log('Generated Custom Token:', token);

      // Ensure all necessary fields are included in the response
      const userData = {
        id: user.farmerID,
        username: user.name,
        phone_number: user.phoneNumber,
        name: user.name,
        avatar: user.avatar || '',
        remember_token: token,
        created_at: user.created_at || '',
        updated_at: user.updated_at || '',
        district_id: user.district_id || '',
        district_name: user.district_name || '',
        sex: user.gender || '',
        role_id: user.role_id || '',
        role_name: user.role_name || '',
      };

      console.log("User Data to be Sent:", userData); // Logging for debugging
      res.status(200).send(userData);
    } else {
      console.log('User Not Found in Firestore');
      res.status(404).send({ error: 'User not found' });
    }
  } catch (e) {
    console.error('Error Authenticating User:', e);
    res.status(500).send({ error: 'Failed to authenticate user', details: e.message });
  }
});

// Other routes for updating, deleting farmers, and farms can be defined similarly

module.exports = router;
