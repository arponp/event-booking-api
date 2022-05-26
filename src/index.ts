import "dotenv/config";
import bodyParser from "body-parser";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import mongoose from "mongoose";
import EventModel from "./models/event";

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
        }
        schema {
            query: RootQuery 
            mutation: RootMutation 
        }
    `),
    rootValue: {
      events: () => {},
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
          });
          const result = await event.save();
          console.log(result);
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
