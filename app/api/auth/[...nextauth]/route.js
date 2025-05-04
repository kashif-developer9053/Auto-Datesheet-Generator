import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const prisma = new PrismaClient();

// Get the database URL from environment variables
const mongoUrl = process.env.DATABASE_URL;

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Function to check password with multiple methods
        const checkPassword = async (storedPassword, inputPassword) => {
          if (!storedPassword) return false;
          
          try {
            // Method 1: Standard bcrypt compare (for hashed passwords)
            if (storedPassword.startsWith('$2') || storedPassword.startsWith('$2a$')) {
              try {
                const bcryptResult = await bcrypt.compare(inputPassword, storedPassword);
                console.log("bcrypt compare result:", bcryptResult);
                if (bcryptResult) return true;
              } catch (e) {
                console.log("bcrypt compare error:", e.message);
              }
            }
            
            // Method 2: Plain text comparison (for development)
            const directResult = inputPassword === storedPassword;
            if (directResult) return true;
            
            return false;
          } catch (error) {
            console.error("Password check error:", error);
            return false;
          }
        };

        // Try User model first (via Prisma)
        try {
          console.log("Trying User model via Prisma...");
          const userFromFirstTable = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          if (userFromFirstTable) {
            console.log("Found user in User model:", userFromFirstTable.email);
            
            // Try to validate password
            const isValidPassword = await checkPassword(userFromFirstTable.password, credentials.password);
            
            if (isValidPassword) {
              console.log("Password valid in User model!");
              return {
                id: userFromFirstTable.id,
                email: userFromFirstTable.email,
                name: userFromFirstTable.name,
                role: userFromFirstTable.role
              };
            }
            console.log("Password invalid in User model, will try users collection");
          } else {
            console.log("User not found in User model, will try users collection");
          }
        } catch (error) {
          console.error("Error in User model:", error);
        }

        // If authentication with User model failed, try with users collection (direct MongoDB)
        let mongoClient = null;
        try {
          console.log("Trying direct MongoDB connection to users collection...");
          mongoClient = new MongoClient(mongoUrl);
          await mongoClient.connect();
          
          // Get database name from connection string
          const dbName = mongoUrl.split('/').pop().split('?')[0];
          const db = mongoClient.db(dbName);
          
          // Try to find user in the users collection
          const userFromSecondTable = await db.collection('users').findOne({ 
            email: credentials.email 
          });
          
          console.log("MongoDB users collection result:", userFromSecondTable ? "Found" : "Not found");
          
          if (userFromSecondTable) {
            console.log("Found user in users collection:", userFromSecondTable.email);
            console.log("Password from DB:", userFromSecondTable.password ? "Present" : "Missing");
            
            // Try to validate password
            const isValidPassword = await checkPassword(userFromSecondTable.password, credentials.password);
            
            if (isValidPassword) {
              console.log("Password valid in users collection!");
              return {
                id: userFromSecondTable._id.toString(),
                email: userFromSecondTable.email,
                name: userFromSecondTable.name || userFromSecondTable.username,
                role: userFromSecondTable.role
              };
            } else {
              console.log("Password invalid in users collection");
              throw new Error("Invalid password");
            }
          } else {
            console.log("User not found in users collection");
            throw new Error("User not found");
          }
        } catch (error) {
          console.error("Error with direct MongoDB connection:", error);
          throw new Error("Authentication failed");
        } finally {
          if (mongoClient) {
            await mongoClient.close();
            console.log("MongoDB connection closed");
          }
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable NextAuth debugging
});

export { handler as GET, handler as POST };