import MovieModel from '../models/Movie.js';

const movieResolvers = {
  Query: {
    getAllMovies: async () => {
      return await MovieModel.find();
    },

    getMovieById: async (_, { id }) => {
      return await MovieModel.findById(id);
    },

    getMoviesByDirector: async (_, { director_name }) => {
      return await MovieModel.findByDirector(director_name);
    }
  },

  Mutation: {
    addMovie: async (_, args) => {
      const movie = new MovieModel(args);
      return await movie.save();
    },

    updateMovie: async (_, { id, ...updates }) => {
      return await MovieModel.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      });
    },

    deleteMovie: async (_, { id }) => {
      return await MovieModel.findByIdAndDelete(id);
    }
  }
};

export default movieResolvers;
