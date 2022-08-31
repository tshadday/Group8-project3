const { AuthenticationError } = require("apollo-server-express");
const { petSchema, Owner,Chat, message, Message } = require('../models');

const {signToken} = require('../utils/auth');

const resolvers = {
  Query: {
    owner: async (parent, { username }) => {
      return Owner.findOne({ username }).populate('pet')
    },


    chat: async (parent, { username }) => {
      return Chat.findOne({ username }).populate('messages')
    },

    pet: async (parent, { petId }) => {
      return petSchema.findOne({ _id: petId });
    },
  },

  Mutation: {
    login: async( parent, {email, password}) => {
      const owner = await Owner.findOne({email});

      if(!owner) {
          throw new AuthenticationError('Owner not found');
      }

      const correctPw = await owner.isCorrectPassword(password);

      if(!correctPw) {
        throw new AuthenticationError('Didnt say the magic word!');
      }

      const token = signToken(owner);
      return { token, owner };
    },

    createChat: async (parent, args) => {
      const chat = await Chat.create(args);
      return chat
    },
    createMessage: async (parent, args) => {
      const message = await Message.create(args);
      Chat = await Chat.findByIdAndUpdate(
        {_id:message.chat.id},
        {$addtoSet: {messages:message}},
        {new:true})
      return chat
    },


    createOwner: async (parent, {username, email, password}) => {
      const owner = await Owner.create({username, email, password});
      const token = signToken(owner);
      return {token, owner}
    },

    createPet: async (parent, { petData }, context) => {
     // if (context.owner) {
        const updatedPet = await Owner.findByIdAndUpdate(
          { _id: context.owner._id },
          { $push: { pet: petData } },
          { new: true }
        );

        return updatedPet;
      //}

      // throw new AuthenticationError('You need to be logged in!');
     },

    updatePet: async(parent, {petData}, context) => {
      if(context.owner) {
        const owner = await Owner.findByIdAndUpdate(
          { _id: context.owner._id },
          { $Set: { pet : petData } },
          { new: true }
        );
        return owner;
      }
      throw new AuthenticationError('You Didnt say the magic word');
    },
  },
};
  
module.exports = resolvers;