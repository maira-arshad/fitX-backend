require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const cors = require("cors");
const userRepsModel = require("./models/userRepModel");
const signUpModel = require("./models/signUpModel");
const tumbnailModel = require("./models/tumbnailModel");
const login = require("./routes/login");
const watchHistory = require("./routes/watchHistory");
const auth = require("./middleware/auth");
const mongoose = require("mongoose");

const app = express();
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with your API credentials
cloudinary.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.API_Key,
  api_secret: process.env.API_Secret,
});
app.use(cors());
app.use(express.json());

app.use("/videos", express.static(path.join(__dirname, "videos")));
app.use("/thumbnails", express.static(path.join(__dirname, "thumbnails")));
app.use("/api/login", login);
app.use("/api/history", watchHistory);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected!");
    app.listen(port, () => {
      console.log(`App is listening on port ${port}...`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
const tokenEndpoint =
  "https://customer-console-prod.auth.us-west-2.amazoncognito.com/oauth2/token";
const scope = "https://api.getguru.fitness/default";

const requiredEnvVariables = [
  "MONGODB_URL",
  "FITX_SECRET_KEY",
  "GURU_Client_ID",
  "GURU_Client_Secret",
];

requiredEnvVariables.forEach((envVar) => {
  if (!process.env.hasOwnProperty(envVar)) {
    console.error(`FATAL ERROR: ${envVar} environment variable is not defined`);
    process.exit(1);
  }
});

const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.status(200).send("fitxAPI is live now...");
});
async function getToken() {
  const body = `grant_type=client_credentials&client_id=${process.env.GURU_Client_ID}&client_secret=${process.env.GURU_Client_Secret}&scope=${scope}`;

  try {
    const response = await axios.post(tokenEndpoint, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data.access_token;
  } catch (error) {
    return error;
  }
}

app.post("/api/signup", async (req, res) => {
  try {
    const { email } = req.body;
    const emailValid = isValidEmail(email);
    if (!emailValid) {
      return res.status(400).send({ message: `${email} is not valid email` });
    } else {
      const emailExist = await signUpModel
        .findOne({ email: email })
        .select({ email: 1 })
        .limit(1);
      if (emailExist) {
        return res
          .status(409)
          .send({ message: `'${emailExist["email"]}' is already exist` });
      } else {
        let { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        req.body.password = password;
        const user = await signUpModel.create(
          _.pick(req.body, [
            "firstName",
            "lastName",
            "email",
            "password",
            "weight_kg",
            "height_cm",
          ])
        );
        // To set header token during signup
        const idToken = jwt.sign(
          { user: _.pick(user, ["_id", "firstName", "lastName", "email"]) },
          process.env.FITX_SECRET_KEY,
          { expiresIn: "1000y" } // Set expiry to 1000 years
        );
        res.setHeader("x-auth-token", idToken);
        const accessToken = await getToken();
        res.status(201).send({
          data: {
            user: _.pick(user, [
              "_id",
              "firstName",
              "lastName",
              "email",
              "weight_kg",
              "height_cm",
            ]),
            idToken: idToken,
            accessToken: accessToken,
          },
        });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post("/api/user", auth, async (req, res) => {
  try {
    const { email, userID } = req.body;
    const emailValid = isValidEmail(email);
    const userExist = await signUpModel.findOne({ userID: userID });
    if (userExist != null) {
      return res
        .status(409)
        .send({ message: `user with ${userID} id is already exist` });
    }
    if (!emailValid) {
      return res.status(400).send({ message: `${email} is not valid email` });
    } else {
      const emailExist = await signUpModel
        .findOne({ email: email })
        .select({ email: 1 })
        .limit(1);
      if (emailExist) {
        return res
          .status(409)
          .send({ message: `'${emailExist["email"]}' is already exist` });
      } else {
        const user = await signUpModel.create(req.body);
        res.status(201).send({ data: user });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post("/api/userReps", auth, async (req, res) => {
  try {
    const { videoID } = req.body;
    const videoIDExist = await userRepsModel.findOne({ videoID: videoID });
    if (videoIDExist) {
      return res
        .status(409)
        .send({ message: `video with ${videoID} id is already exist` });
    }
    const createdUserRep = await userRepsModel.create(req.body);
    res
      .status(201)
      .send({ status: "success", data: { userRep: createdUserRep } });
  } catch (error) {
    res.status(400).send({ status: "error", message: error.message });
  }
});

// app.get("/api/userLift/:userID", auth, async (req, res) => {
//   try {
//     const { userID } = req.params;
//     const { liftType } = req.query;
//     const { date } = req.query;
//     if (!date) {
//       return res.status(400).send({
//         message:
//           "Date is required in the format yyyy-mm-dd (2023-05-21T12:00:00.000Z)",
//       });
//     }
//     const curr = new Date(date);
//     const first = curr.getDate() - curr.getDay();
//     const last = first + 6;

//     var firstday = new Date(curr.setDate(first)).toUTCString();
//     var lastday = new Date(curr.setDate(last)).toUTCString();

//     const userReps = await userRepsModel.find({
//       userID: userID,
//       liftType: liftType,
//       date: {
//         $gte: firstday,
//         $lte: lastday,
//       },
//     });
//     if (!userReps || userReps.length === 0) {
//       return res.status(404).send({ message: "User reps not found" });
//     }

//     // calculate the sum of attempted reps
//     const sumAttemptedReps = userReps.reduce((total, userRep) => {
//       return total + userRep.attemptedReps;
//     }, 0);

//     res.status(200).send({
//       status: "success",
//       data: { userID: userID, total_attemtedReps: sumAttemptedReps },
//     });
//   } catch (error) {
//     res.status(505).send({ status: "error", message: error.message });
//   }
// });

app.get("/api/leaderboards", auth, async (req, res) => {
  try {
    const { liftType, limit } = req.query;
    const userReps = await userRepsModel.aggregate([
      { $match: { liftType: liftType } },
      {
        $lookup: {
          from: "signups",
          localField: "userID",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$userID",
          totalAttemptedReps: { $sum: "$attemptedReps" },
          weight: { $first: "$user.weight_kg" },
          liftType: { $first: "$liftType" },
          firstName: { $first: "$user.firstName" },
          lastName: { $first: "$user.lastName" },
        },
      },
      {
        $project: {
          userID: "$_id",
          _id: 0,
          totalAttemptedReps: 1,
          liftType: 1,
          firstName: 1,
          lastName: 1,
        },
      },
      {
        $limit: parseInt(limit) || 1000,
      },
    ]);
    if (userReps.length > 0) {
      res.status(200).send({ status: "success", data: userReps });
    } else {
      res.status(404).send({ status: "error", message: "No user Reps found" });
    }
  } catch (error) {
    res.status(505).send({ status: "error", message: error.message });
  }
});

app.patch("/api/user/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedContent = _.pick(
      req.body,
      "firstName",
      "lastName",
      "height_cm",
      "weight_kg"
    );
    const user = await signUpModel.findByIdAndUpdate(id, updatedContent);
    if (!user) {
      return res.status(404).json({ message: "can not find the user" });
    }
    const updatedUser = await signUpModel.findById(id);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).send({ status: "error", message: error.message });
  }
});

app.delete("/api/user/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await signUpModel.findOneAndRemove({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "can not find the user" });
    }
    res
      .status(200)
      .send({ status: "success", data: "account deleted successfully" });
  } catch (error) {
    res.status(400).send({ status: "error", message: error.message });
  }
});

app.get("/api/userLift/:userID/:liftType", auth, async (req, res) => {
  try {
    const { userID, liftType } = req.params;
    const { date } = req.query;
    if (!userID || !liftType) {
      return res.status(400).send({
        message: "Both userID and liftType are required",
      });
    }
    if (!date) {
      return res.status(400).send({
        message:
          "Date is required in the format yyyy-mm-dd (2023-05-21T12:00:00.000Z)",
      });
    }
    const today = new Date(date);
    // Get the date 7 days ago
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const userReps = await userRepsModel.find({
      userID: userID,
      liftType: liftType,
      date: {
        $gte: sevenDaysAgo,
        $lte: today,
      },
    });
    if (!userReps || userReps.length === 0) {
      return res.status(404).send({ message: "User reps not found" });
    }

    // calculate the sum of attempted reps
    const sumAttemptedReps = userReps.reduce((total, userRep) => {
      return total + userRep.attemptedReps;
    }, 0);

    res.status(200).send({
      status: "success",
      data: { userID: userID, total_attemtedReps: sumAttemptedReps },
    });
  } catch (error) {
    res.status(505).send({ status: "error", message: error.message });
  }
});

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

app.get("/api/refresh", async (req, res) => {
  try {
    const newRefreshToken = await getToken();

    res.status(200).json({
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve new refresh token",
    });
  }
});

// Function to fetch video URL from the external API using accessToken and videoId
async function getVideoUrl(accessToken, videoId) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const response = await axios.get(
      `https://api.getguru.fitness/videos/${videoId}`,
      { headers }
    );

    const cc = response.data.overlays?.all?.uri || response.data.uri;
    console.log(cc);
    return cc;
  } catch (error) {
    console.error("Error fetching video URL:", error.message);
    throw error;
  }
}

// ... (previous code)

app.post("/thumbnail", auth, async (req, res) => {
  const { accessToken, videoId } = req.body;

  try {
    // Check if the videoId exists in the database
    const existingVideo = await tumbnailModel.findOne({ videoId });
    if (existingVideo && existingVideo.thumbnailPath) {
      console.log(
        "VideoId found in the database. Returning the saved thumbnail URL."
      );
      return res.json({ videoId, thumbnailPath: existingVideo.thumbnailPath });
    }

    // If thumbnailPath does not exist, proceed with downloading video and generating thumbnail
    const outputPath = `videos/video${Date.now()}.mp4`;
    const thumbnailFile = `thumb${Date.now()}.png`;
    const thumbnailPath = `thumbnails/${thumbnailFile}`;
    console.log(outputPath);
    console.log(thumbnailPath);

    // Get the video URL from the external API
    const videoUrl = await getVideoUrl(accessToken, videoId);

    // Download the video
    const response = await axios.get(videoUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log("Video downloaded successfully");

    // Upload the first 3 seconds of the video to Cloudinary with low resolution
    const videoUpload = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
      overwrite: true,
      eager_async: true,
      eager: [
        // Step 1: Generate an image thumbnail using an eager transformation
        { crop: "fill", format: "png" },
      ],
      transformation: [
        // Step 2: Resize and limit the video to the first 3 seconds
        { duration: 3, start_offset: 0, crop: "scale", video_codec: "h264" },
      ],
    });

    // Step 3: Get the URL of the generated thumbnail from the video upload response
    const cloudinaryThumbnailUrl = videoUpload.eager[0].secure_url;
    console.log("Thumbnail generated successfully");

    // Delete the video file after generating the thumbnail
    fs.unlinkSync(outputPath);
    console.log("Video file deleted successfully");

    // Save videoId and thumbnailPath in the database or update if videoId already exists
    if (existingVideo) {
      existingVideo.thumbnailPath = cloudinaryThumbnailUrl;
      await existingVideo.save();
    } else {
      const newVideo = new tumbnailModel({
        videoId,
        thumbnailPath: cloudinaryThumbnailUrl,
      });
      await newVideo.save();
    }

    // Respond with videoId and thumbnailPath
    res.json({ videoId, thumbnailPath: cloudinaryThumbnailUrl });
  } catch (error) {
    console.error("Error processing video:", error.message);
    res.status(401).send(error.message);
  }
});
