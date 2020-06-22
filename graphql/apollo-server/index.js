const { ApolloServer, gql, PubSub, withFilter } = require('apollo-server');
const pubsub = new PubSub()
const typeDefs = gql`
  type Query {
    hello: String,
    books: [Book],
    book(id : String) : Book
  }

  type Book {
    id:String
    title: String
    author: String
  }

  type Mutation {
    
    createBook(title: String, author: String): Book!,

    clearBook : Boolean
  }

  type Subscription {
    subsBooks : Boolean,
  }

`;

// clearBook():Book
const books = (
    () => Array(5).fill().map((v, i) => ({
        id: '' + i,
        title: 'Title' + i,
        author: 'Author' + i
    }))
)()

const resolvers = {
    Query: {
        hello: () => 'Hello world!',
        books: () => books,
        book: (parent, { id }) => {
            return books.find(v => v.id === id)
        }
    },

    Mutation: {
        createBook: (parent, args) => {
            const book = {...args,id: books.length + 1 + ''}
            books.push(book)
            // 发布订阅消息
            pubsub.publish('UPDATE_BOOK', {
                subsBooks: true
            })
            return book
        },
        clearBook: () => {
            books.length = 0
            pubsub.publish('UPDATE_BOOK', {
                subsBooks: true
            })
            return true
        }
    },

    Subscription: {
        subsBooks: {
            // 过滤不需要订阅的消息
            subscribe: withFilter(
                (parent, variables) => pubsub.asyncIterator('UPDATE_BOOK'),
                (payload, variables) => true
            )
        },
    }

};

// setInterval(() => {
//     // console.log('update....')
//     pubsub.publish('UPDATE_BOOK', {
//         subsBooks: books
//     })
// }, 1000)

const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});