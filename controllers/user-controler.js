const pool = require("../db/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const getAllUsers = async (req, res) => {
    try {
        console.log("API hit");
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({ error: "Database error" });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || username.trim() === "") {
            return res.status(400).json({ success: false, message: "username is required" });
        }
        if (!email || email.trim() === "") {
            return res.status(400).json({ success: false, message: "email is required" });
        }
        if (!password || password.trim() === "") {
            return res.status(400).json({ success: false, message: "password is required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [username, email, hashedPassword, role || "user"]
        );

        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, role } = req.body;

        // Build dynamic SET parts
        let updates = [];
        let values = [];
        let counter = 1;

        if (username) {
            updates.push(`username = $${counter++}`);
            values.push(username);
        }
        if (email) {
            updates.push(`email = $${counter++}`);
            values.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password = $${counter++}`);
            values.push(hashedPassword);
        }
        if (role) {
            updates.push(`role = $${counter++}`);
            values.push(role);
        }

        // If no fields provided
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "No fields provided to update" });
        }

        // Final query
        const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${counter}
      RETURNING *;
    `;

        values.push(id);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User deleted successfully", user: result.rows[0] });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        // Find user
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        // Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error("Error signing in:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const signOut = (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.json({ success: true, message: "Signed out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, signIn, signOut};
