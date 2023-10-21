const express = require('express');
const cors = require('cors');
const Pool = require('pg').Pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const cookieParser = require('cookie-parser');
const {authenticateToken} = require ('./authorization.js')

const app = express();
const port = process.env.PORT || 5000;
// const ip = '192.168.100.33';

// const pool = new Pool({
//   user: "postgres",
//   password: "Legacy14",
//   host: "localhost",
//   port: 5432,
//   database: "ChurchDatabase1"
// });
const pool = new Pool({
  user: "ch_database", 
  password: "R8X3Jn18fluQ9kI2bsMoVNYW63K8yz61", 
  host: "dpg-ckm42g8710pc73fcdav0-a.oregon-postgres.render.com", 
  port: 5432,
  database: "ch_database",
});
const ACCESS_TOKEN_SECRET = '123HGFDDFF87653WREFDVKJHGSDF987653WRE';
const REFRESH_TOKEN_SECRET = 'dsfdghg98764354jkhgfdsfghyygygt567kjhbvdfg';


app.use(express.json());

app.use(cors());

app.use(cookieParser());


app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.query;
    const fields = req.query.fields;


    // Validate the search query
    if (!query || query.length < 3) {
      console.error('Please enter at least 3 characters');
      return res.status(400).json({ error: 'Please enter at least 3 characters' });
    }

    // Construct the search query dynamically
    const searchConditions = fields.map((field, index) => {
      if (field === 'dateofbirth') {
        // Handle date columns differently
        return `CAST(${field} AS TEXT) ILIKE $${index + 1}`;
      } else {
        // Handle other text columns
        return `${field} ILIKE $${index + 1}`;
      }
    });
    
    const searchQuery = `
      SELECT *
      FROM members
      WHERE ${searchConditions.join(' OR ')}
        OR residenceaddress ILIKE $${fields.length + 1}
        OR occupation ILIKE $${fields.length + 2}
        OR phonenumber ILIKE $${fields.length + 3}
        OR maritalstatus ILIKE $${fields.length + 4}
    `;

  
    const client = await pool.connect();

    // Convert all fields to text format for searching
    const searchFieldValues = fields.map(() => {
      return `%${query}%`;
    });
    searchFieldValues.push(`%${query}%`); // For residenceaddress
    searchFieldValues.push(`%${query}%`); // For occupation
    searchFieldValues.push(`%${query}%`); // For phonenumber
    searchFieldValues.push(`%${query}%`); // For maritalstatus

    const result = await client.query(searchQuery, searchFieldValues);

    const searchResults = result.rows;
    client.release();

    res.json(searchResults);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'An error occurred during the search' });
  }
});


//get all members
app.get('/members', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM members');
        const members = result.rows;
        client.release();
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching members' });
    }
});

//get a member
app.get('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    res.json(member.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
})

//Create a new member
app.post('/members', async (req, res) => {
  try {
        const { name, dateofbirth, residenceaddress, occupation, phonenumber, hobbies, dayborn, hometownaddress,parentsname,age,emailaddress, maritalstatus } = req.body;
        const newMember = await pool.query('INSERT INTO members (name, dateofbirth, residenceaddress, occupation, phonenumber, hobbies, dayborn, hometownaddress,parentsname,age,emailaddress, maritalstatus) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *', [name, dateofbirth, residenceaddress, occupation, phonenumber, hobbies, dayborn, hometownaddress,parentsname,age,emailaddress, maritalstatus]);

       res.json(newMember.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding a member' });
    }
});

//update a member
app.put('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dateofbirth, residenceaddress, occupation, phonenumber, hobbies } = req.body;
    const updateMember = await pool.query('UPDATE members SET name = $1, dateofbirth = $2, residenceaddress=$3, occupation = $4, phonenumber = $5, hobbies = $6 WHERE id = $7', [name, dateofbirth, residenceaddress, occupation, phonenumber, hobbies, id]);

    res.json("Update was successful!");
  } catch (err) {
    console.error(err.message);
  }
})

//delete a member
app.delete('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteMember = await pool.query('DELETE FROM members WHERE id = $1', [id]);

    res.json("Deletion was successful");
  } catch (err) {
    console.error(err.message);
  }
})



// Get all family
app.get('/family', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM Family');
      const familyMembers = result.rows;
      client.release();
      res.json(familyMembers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching family members' });
    }
  });
  
  // Route to get all children from the Children table
  app.get('/children', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM Children');
      const children = result.rows;
      client.release();
      res.json(children);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching children' });
    }
  });
  
  // Route to get all involvement details from the Involvement table
  app.get('/involvement', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM Involvement');
      const involvement = result.rows;
      client.release();
      res.json(involvement);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching involvement details' });
    }
  });

  
  // Route to get all giving history records from the GivingHistory table
  app.get('/giving-history', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM GivingHistory');
      const givingHistory = result.rows;
      client.release();
      res.json(givingHistory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching giving history records' });
    }
  });

  // User Router
const userRouter = express.Router();
  
  //Generate a random staff Id
  const generateStaffID = () => {
    const staffID = Math.floor(Math.random() * 1000000000).toString();
    console.log(staffID);

      return staffID;
  };
  
  //Hash a password
  const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
  };
  
  // Create a new user
  userRouter.post('/register', async (req, res) => {
    try {
      const { staffid, password, email } = req.body;
      const staffID = generateStaffID();
      const hashedPassword = await hashPassword(password);
  
      // Insert the new user into the database
      const newUser = await pool.query('INSERT INTO users (staff_id, password, email) VALUES ($1, $2, $3) RETURNING *', [staffID, hashedPassword, email]);
  
      // Return the new user to the client
      res.json(newUser.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while registering a user' });
    }
  });
  


app.get('/check-auth', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Authenticated' });
});


  
app.post('/login', async (req, res) => {
  try {
    
    const staff_id = req.body.staff_id;

    // Find the user in the database based on the staff ID.
    const user = await pool.query('SELECT * FROM users WHERE staff_id = $1', [staff_id]);

    // If user is not found, return an error.
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    // Generate a JWT token for the user.
    const accessToken = jwt.sign(
      { userId: user.rows[0].id, staff_id: user.rows[0].staff_id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' } 
    );

    //Generate a refresh token
    const refreshToken = jwt.sign(
      { userId: user.rows[0].id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '2m' } 
    );
    
    res.cookie('refresh_token', refreshToken, { httpOnly: true });
    res.json({ accessToken, refreshToken });

    
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'An error occurred while logging in' });
  }
});

app.get('/refresh_token', (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken === null) return res.status(401).json({ error: 'Null refresh token' });
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (error, user) => {
      if (error) return res.status(403).json({ error: error.message });
      const accessToken = jwt.sign(
        { userId: user.userId, staff_id: user.staff_id }, // Correct the variable names here
        ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' } 
      );
      const newRefreshToken = jwt.sign(
        { userId: user.userId }, // Correct the variable name here
        REFRESH_TOKEN_SECRET,
        { expiresIn: '2m' } 
      );
      
      res.cookie('refresh_token', newRefreshToken, { httpOnly: true });
      res.json({ accessToken, refreshToken: newRefreshToken }); // Use newRefreshToken here

    })
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.delete('/refresh_token', (req, res) => {
  try {
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'refresh token deleted' })
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
})


app.use('/user', userRouter);



  
  app.get('/', (req, res) => {
    res.send("Welcome To The Backend Of The Church Database Website by LegacyGh!");
});

app.listen(port,  () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = pool;
