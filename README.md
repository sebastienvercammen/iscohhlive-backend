# IsCohh.live

A simple back-end for the portal to see [CohhCarnage's Twitch.tv channel's](https://www.twitch.tv/cohhcarnage) online status.

Relies on https://github.com/sebastienvercammen/iscohhlive.

This project is NOT affiliated with, funded, or in any way associated with CohhCarnage. All these base are belong to him.

## Getting Started

These instructions will help you deploy the project on a live system.

### Prerequisites

- [Node.js v8.9.0 or higher](https://nodejs.org/en/)
- npm v5.5.0 or higher

```
Windows: To update npm and Node.js, manually download the LTS version from their website.

To update Node.js and npm:
apt-get remove node nodejs
curl -L https://git.io/n-install | bash
n lts

To update only npm:
npm install -g npm
```

### Installing

Start by reading the license in LICENSE.md.

Make sure Node.js and npm are properly installed:

```
node -v
npm -v
```

Clone the project:

```
git clone https://github.com/sebastienvercammen/iscohhlive-backend.git
```

Make sure you are in the project directory with your terminal, and install the dependencies:

```
npm install
```

### Deployment

For deployment, please first read Twitch.tv's [Authentication Guide](https://dev.twitch.tv/docs/authentication).

* Copy [.env.example](.env.example) to `.env`.
* Register your Twitch.tv application: https://dev.twitch.tv/dashboard/apps/create.
* Click "New Secret" to generate a Twitch.tv API Client Secret.
* Edit `.env` with a text editor and fill in your "Client ID" and "Client Secret".
* Edit `.env` and enter your preferred settings.
* Run the server with `node index.js`.

### Process Management

For proper process management, I recommend [pm2](https://github.com/Unitech/pm2).

## License

This project is licensed under "The Unlicense" - see the [LICENSE.md](LICENSE.md) file for details.
