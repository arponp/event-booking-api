import bodyParser from "body-parser";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";

const app = express();

interface Event {
  _id: String;
  title: String;
  description: String;
  price: Number;
  date: String;
}

const events: Event[] = [];

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
      events: () => {
        return events;
      },
      createEvent: (args: {
        eventInput: {
          title: String;
          description: String;
          price: Number;
          date: String;
        };
      }) => {
        const event: Event = {
          _id: Math.random().toString(),
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: args.eventInput.price,
          date: args.eventInput.date,
        };
        events.push(event);
        return event;
      },
    },
    graphiql: true,
  })
);

app.listen(3000, () => console.log("Server Live"));
