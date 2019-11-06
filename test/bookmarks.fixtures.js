function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'google',
      url: 'https://www.google.com',
      rating: 5,
      description: 'search'
    },
    {
      id: 2,
      title: 'youtube',
      url: 'https://www.youtube.com',
      rating: 4,
      description: 'video'
    },
    {
      id: 3,
      title: 'wikipedia',
      url: 'https://www.wikipedia.org',
      rating: 3,
      description: 'encyclopedia'
    },
  ];
}

module.exports = {
  makeBookmarksArray
};