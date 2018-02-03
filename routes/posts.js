const debugSuccess = require('debug')('pervy:routes:posts:info');
const debugError = require('debug')('pervy:routes:posts:error');
const debugRoute = require('debug')('pervy:routes:posts:debug');
const url = require('url');

const Post = require('../models/Post');

function handlePostRoute(request, response) {
    const parsedRequest = url.parse(request.url, true);
    const path = parsedRequest.pathname;

    // Only handle the one path.
    if (path !== '/posts.json') {
        debugError('Refused request for %s.', path);
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        return response.end();
    }

    // Prep to reply.
    const params = parsedRequest.query;
    const lowestPostIdOnPage = params.start || -1;
    const category = (params.category) ? params.category.toLowerCase() : false;

    debugSuccess('Requesting posts before %d.', lowestPostIdOnPage);

    debugRoute('Incoming request: %O', parsedRequest);
    debugRoute('Received in routes post: %O.', params);

    // Homepage is unfiltered.
    const isRealCategory = category && filters.hasOwnProperty(category);

    // Helpers.
    function loadedPosts(posts) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        return response.end(JSON.stringify(posts));
    }
    
    function errorLoadingPosts(err) {
        console.error(err);
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        return response.end();
    }

    if (category === 'random') {
        // Load a handful of random items.
        // Note: right now we don't care if they're already loaded.
        // We don't expect people to pay very much attention. ;)
        // and we only show one page of random items, no infinite scroll.
        Post.get_random_page().then(loadedPosts).catch(errorLoadingPosts);
    } else if (isRealCategory) {
        // Load a category from our filters.
        const filter = filters[category];
        Post.get_page_by_categories(lowestPostIdOnPage, filter).then(loadedPosts).catch(errorLoadingPosts);
    } else {
        // Load homepage, randomized.
        // TODO: Exclude items already loaded.
        //Post.get_page(lowestPostIdOnPage).then(loadedPosts).catch(errorLoadingPosts);
        Post.get_random_page().then(loadedPosts).catch(errorLoadingPosts);
    }
}

module.exports = handlePostRoute;