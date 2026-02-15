import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB database.

 */
export async function connectDB(): Promise<void> {

  // Get MongoDB connection URI from environment variables
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/taskmanager';

  try {
    // Connection options for better reliability in serverless environments
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
      maxPoolSize: 10,                  // Maintain up to 10 socket connections
      minPoolSize: 2,                   // Maintain at least 2 socket connections
    };

    // Attempt to connect to MongoDB using Mongoose
    await mongoose.connect(uri, options);

    // Log success message if connection is established
    console.log('MongoDB connected successfully');
    console.log('Connected to:', uri.split('@')[1]?.split('?')[0] || 'database');
  } catch (error) {
    // Log detailed error if connection fails
    console.error('MongoDB connection failed:', error);
    console.error('Connection URI (masked):', uri.replace(/\/\/.*:.*@/, '//***:***@'));

    // In serverless, don't exit - let the function fail gracefully
    if (process.env.NODE_ENV === 'production') {
      console.error('Running in production - connection will retry on next request');
    } else {
      // Exit process with failure code in development
      process.exit(1);
    }
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});
