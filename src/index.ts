import "dotenv/config";
import bodyParser from "body-parser";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import mongoose from "mongoose";
import EventModel from "./models/event";
import UserModel from "./models/user";
import bcrypt from "bcryptjs";

const app = express();

app.use(bodyParser.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type Event {
          _id: ID!
          title: String!
          description: String!
          price: Float!
          date: String!
        }
        type User {
          _id: ID!
          email: String!
          password: String
          createdEvents: [ID!]!
        }
        input UserInput {
          email: String!
          password: String!
        }
        input EventInput {
          title: String!
          description: String!
          price: Float!
          date: String!
        }
        type RootQuery {
            events: [Event!]!
        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }
        schema {
            query: RootQuery 
            mutation: RootMutation 
        }
    `),
    rootValue: {
      events: async () => {
        try {
          return await EventModel.find().lean();
        } catch (e: unknown) {
          if (e instanceof Error) {
            throw e;
          }
          return null;
        }
      },
      createUser: async (args: {
        userInput: { email: string; password: string };
      }) => {
        try {
          const isUser = await UserModel.findOne({
            email: args.userInput.email,
          });
          if (isUser) {
            throw new Error("User exists already");
          }
          const hashPass = await bcrypt.hash(args.userInput.password, 12);
          const user = new UserModel({
            email: args.userInput.email,
            password: hashPass,
            createdEvents: [],
          });
          const result = await user.save();
          return { ...result._doc, password: null, _id: result.id };
        } catch (e: unknown) {
          if (e instanceof Error) {
            throw e;
          }
          return null;
        }
      },
      createEvent: async (args: {
        eventInput: {
          title: string;
          description: string;
          price: number;
          date: string;
        };
      }) => {
        try {
          const event = new EventModel({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date),
            creator: "6292754b2a10009eeb01ab3a",
          });
          const result = await event.save();
          const user = await UserModel.findById("6292754b2a10009eeb01ab3a");
          if (!user) {
            throw new Error("User not found");
          }
          user.createdEvents.push(event);
          await user.save();
          return { ...result._doc };
        } catch (e: unknown) {
          if (e instanceof Error) {
            throw e;
          }
          return null;
        }
      },
    },
    graphiql: true,
  })
);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ioed6.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000, () => console.log("Server live"));
  })
  .catch((err) => {
    console.log(err.message);
  });
