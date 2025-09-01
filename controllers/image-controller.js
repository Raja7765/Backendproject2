const pool = require("../db/db.js");
const { uploadToCloudinary } = require("../helpers/cloudinaryHelper");
const cloudinary = require("../config/cloudinary");

// Upload image (Admin/User depending on role)
const uploadimageController = async (req, res) => {
  try {
    // Check if file exists
    console.log(req)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required. Please upload an image",
      });
    }

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.path);

    // Store in PostgreSQL
    const result = await pool.query(
      `INSERT INTO images (url, public_id, uploaded_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [url, publicId, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image: result.rows[0],
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

// Fetch all images (with pagination + sorting)
const fetchimagesController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const sortBy = req.query.sort || "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    // Get total count
    const totalRes = await pool.query("SELECT COUNT(*) FROM images");
    const totalImages = parseInt(totalRes.rows[0].count);
    const totalPages = Math.ceil(totalImages / limit);

    // Fetch paginated images
    const result = await pool.query(
      `SELECT * FROM images ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      totalImages,
      data: result.rows,
    });
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

// Delete image
const deleteImageController = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.userInfo.userId;
    const userRole = req.userInfo.role; // from JWT payload

    // Get image from DB
    const result = await pool.query("SELECT * FROM images WHERE id = $1", [
      imageId,
    ]);
    const image = result.rows[0];

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Check if user is authorized (Admin or Owner)
    if (userRole !== "admin" && image.uploaded_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this image.",
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.public_id);

    // Delete from PostgreSQL
    await pool.query("DELETE FROM images WHERE id = $1", [imageId]);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

module.exports = {
  uploadimageController,
  fetchimagesController,
  deleteImageController,
};
