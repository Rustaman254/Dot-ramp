"use client";

import React from "react";
import { Wallet, BookOpen, ExternalLink, Link as LinkIcon, Hammer, CheckCircle2, AlertCircle } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/cjs/styles/prism";

const apiBase = "https://dotramp.com/api/v1";

const sections = [
  { id: "overview", title: "Overview" },
  { id: "features", title: "Features" },
  { id: "prerequisites", title: "Prerequisites" },
  { id: "install", title: "Installation" },
  { id: "run", title: "Running" },
  { id: "endpoints", title: "API Endpoints" },
  { id: "testing", title: "Testing" },
  { id: "security", title: "Security" },
  { id: "structure", title: "Project Structure" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "contributing", title: "Contributing" },
  { id: "support", title: "Support" },
  { id: "resources", title: "Resources" }
];

const codeStyle = {
  borderRadius: "0.5rem",
  background: "#181824",
  fontSize: "1rem",
  padding: "1.25rem",
  margin: 0
};

const SectionTitle: React.FC<{ id: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  id,
  icon,
  children
}) => (
  <h3
    id={id}
    className="text-lg font-semibold mb-3 text-emerald-400 flex items-center gap-2 scroll-mt-24"
  >
    {icon || <BookOpen className="w-5 h-5 text-emerald-400" />}
    {children}
    <a
      href={`#${id}`}
      className="text-zinc-500 hover:text-emerald-300 ml-1 transition"
      aria-label="Anchor link"
    >
      <LinkIcon className="w-4 h-4" />
    </a>
  </h3>
);

const scrollToSection = (id: string) => {
  if (typeof window !== "undefined") {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
};

const DeveloperDocs: React.FC = () => (
  <div className="min-h-screen min-w-full bg-gradient-to-tl from-black via-zinc-900/90 to-black text-white flex flex-col">
    <div className="border-b border-zinc-800 flex-shrink-0 sticky top-0 z-30 bg-black/95 backdrop-blur supports-backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-400" /> DotRamp Developer Hub
          </h1>
        </div>
        <a href="/" className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/10 rounded-xl px-4 py-3 font-medium text-emerald-300 hover:bg-emerald-700/10 hover:text-white transition-colors">
          <ExternalLink className="w-5 h-5" /> Back to DotRamp
        </a>
      </div>
    </div>

    <div className="flex flex-1 w-full max-w-6xl mx-auto">
      <aside className="hidden lg:flex flex-col w-64 bg-black border-r border-zinc-800 py-8 px-4 sticky top-0 h-[calc(100vh-64px)]">
        <nav className="space-y-1">
          <div className="mb-4 uppercase text-xs text-gray-500 font-bold tracking-widest">Sections</div>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="block w-full text-left px-2 py-2 rounded-lg transition text-gray-300 hover:bg-emerald-700/10 hover:text-emerald-400 text-sm"
            >
              {section.title}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 lg:p-16">
        <section id="overview" className="mb-10 scroll-mt-24">
          <span className="inline-flex gap-2 items-center rounded-lg bg-emerald-700/10 px-2 py-1 mb-4 text-emerald-300 font-bold uppercase text-xs">
            <CheckCircle2 className="w-4 h-4" /> Open Source Onramp
          </span>
          <h2 className="text-3xl font-bold mb-2">DotRamp - Crypto On/Off Ramp for Paseo Network</h2>
          <p className="mb-6 text-gray-200 text-lg">
            A complete crypto on-ramp and off-ramp solution that lets users buy and sell Polkadot ecosystem tokens (PAS, USDT, USDC, DAI) using MPESA mobile money.
          </p>
        </section>

        <section id="features" className="mb-10 scroll-mt-24">
          <SectionTitle id="features" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}>Features</SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2 text-base">
            <li>Buy Crypto: Pay with MPESA, receive crypto in your wallet</li>
            <li>Sell Crypto: Send crypto, receive KES via MPESA</li>
            <li>Multi-Token Support: PAS, USDT, USDC, DAI</li>
            <li>Real-time Status Tracking</li>
            <li>Automatic processing of confirmed payments</li>
            <li>RESTful API for seamless integration</li>
          </ul>
        </section>

        <section id="prerequisites" className="mb-10 scroll-mt-24">
          <SectionTitle id="prerequisites" icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}>Prerequisites</SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2 text-base">
            <li>Node.js &gt;= 18.0.0 and npm &gt;= 9.0.0</li>
            <li>MPESA Daraja API credentials</li>
            <li>Admin wallet with funds on Paseo Network</li>
          </ul>
        </section>

        <section id="install" className="mb-10 scroll-mt-24">
          <SectionTitle id="install" icon={<Hammer className="w-5 h-5 text-emerald-400" />}>Installation & Setup</SectionTitle>
          <p className="mb-4 text-gray-300">To install and prepare your DotRamp node:</p>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`git clone https://github.com/yourusername/dotramp.git
cd dotramp
npm install
cp .env.example .env`}
          </SyntaxHighlighter>
          <p className="mb-2 mt-4">Edit your <b>.env</b> file with your MPESA and wallet credentials:</p>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`# Server
PORT=3000
NODE_ENV=development

# Admin Wallet
ADMIN_MNEMONIC="your twelve word mnemonic here"

# MPESA Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASS_KEY=your_passkey

# MPESA Callbacks (must be public for local testing)
MPESA_CALLBACK=https://yourdomain.com/api/v1/callback
MPESA_B2C_RESULT_URL=https://yourdomain.com/api/v1/b2c/result
MPESA_B2C_TIMEOUT_URL=https://yourdomain.com/api/v1/b2c/timeout

# B2C and Security
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_security_credential`}
          </SyntaxHighlighter>
        </section>

        <section id="run" className="mb-10 scroll-mt-24">
          <SectionTitle id="run">Running the Application</SectionTitle>
          <p className="mb-4 text-gray-300">Development:</p>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`npm run dev`}
          </SyntaxHighlighter>
          <p className="mb-4 mt-4 text-gray-300">Production:</p>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`npm run build
npm start`}
          </SyntaxHighlighter>
          <p className="mt-4 text-gray-300">For MPESA callbacks in local dev, use ngrok:</p>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`ngrok http 3000 # then paste url into .env`}
          </SyntaxHighlighter>
        </section>

        <section id="endpoints" className="mb-10 scroll-mt-24">
          <SectionTitle id="endpoints">API Endpoints</SectionTitle>
          <table className="w-full border border-zinc-800 mb-4 text-sm">
            <thead>
              <tr className="bg-zinc-800 text-emerald-400">
                <th className="text-left px-3 py-2">Method</th>
                <th className="text-left px-3 py-2">Endpoint</th>
                <th className="text-left px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">GET</td><td>/api/v1/health</td><td>Health check</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">GET</td><td>/api/v1/tokens</td><td>Get supported tokens</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">GET</td><td>/api/v1/rates</td><td>Get exchange rates</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">GET</td><td>/api/v1/admin/address</td><td>Get admin wallet address</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">POST</td><td>/api/v1/buy</td><td>Buy crypto with MPESA</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">POST</td><td>/api/v1/sell</td><td>Sell crypto for MPESA</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">GET</td><td>/api/v1/status</td><td>Check payment status</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">POST</td><td>/api/v1/payout</td><td>Manual payout</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">POST</td><td>/api/v1/process-payments</td><td>Process confirmed payments</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-3 py-2">GET</td><td>/api/v1/transactions/history</td><td>Get transaction history</td></tr>
            </tbody>
          </table>
          <div className="text-xs text-gray-400 mb-2">
            See your <span className="text-emerald-400">README.md</span> or repository docs for a detailed endpoint reference.
          </div>
        </section>

        <section id="testing" className="mb-10 scroll-mt-24">
          <SectionTitle id="testing">Testing</SectionTitle>
          <p className="mb-2 text-gray-300">Test the buy, sell, and status flows with curl:</p>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`curl -X POST http://localhost:3000/api/v1/buy \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "254712345678",
    "amount": 100,
    "token": "PAS",
    "userAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  }'
curl "http://localhost:3000/api/v1/status?merchantRequestId=..."
curl -X POST http://localhost:3000/api/v1/sell -H "Content-Type: application/json" -d '{ "phone": "254712345678", "amount": "10.5", "token": "USDT", "fromAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" }'`}
          </SyntaxHighlighter>
        </section>

        <section id="security" className="mb-10 scroll-mt-24">
          <SectionTitle id="security">
            Security Best Practices
          </SectionTitle>
          <ul className="list-decimal ml-8 text-gray-300 space-y-2 text-base">
            <li>Never commit <code>.env</code> file</li>
            <li>Use env vars for all secrets</li>
            <li>Enable HTTPS in production</li>
            <li>Rate limit API endpoints</li>
            <li>Validate all inputs</li>
            <li>Monitor all transactions</li>
            <li>Keep dependencies updated</li>
            <li>Use strong authentication for admin endpoints</li>
            <li>Regularly rotate keys/credentials</li>
            <li>Back up admin mnemonic securely</li>
          </ul>
        </section>

        <section id="structure" className="mb-10 scroll-mt-24">
          <SectionTitle id="structure">
            Project Structure
          </SectionTitle>
          <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`dotramp/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   └── server.ts
├── dist/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md`}
          </SyntaxHighlighter>
        </section>

        <section id="troubleshooting" className="mb-10 scroll-mt-24">
          <SectionTitle id="troubleshooting" icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}>
            Troubleshooting
          </SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>MPESA STK Push: Check phone format, credentials, callback URLs, and Daraja API logs</li>
            <li>Crypto transfer failed: Verify admin wallet balance, network/RPC config, mnemonic</li>
            <li>API offline: Check health endpoint, server process, .env config, and logs</li>
          </ul>
        </section>

        <section id="contributing" className="mb-10 scroll-mt-24">
          <SectionTitle id="contributing">
            Contributing
          </SectionTitle>
          <ol className="list-decimal ml-8 text-gray-300 space-y-2">
            <li>Fork the repository</li>
            <li>Create a branch</li>
            <li>Commit changes</li>
            <li>Push &amp; open a Pull Request</li>
          </ol>
        </section>

        <section id="support" className="mb-10 scroll-mt-24">
          <SectionTitle id="support">
            Support
          </SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>Email: <a href="mailto:support@dotramp.com" className="text-emerald-400">support@dotramp.com</a></li>
            <li>GitHub Issues: <a href="https://github.com/yourusername/dotramp/issues" className="text-emerald-400" target="_blank" rel="noopener noreferrer">Open an issue</a></li>
            <li>Telegram: <span className="text-emerald-400">@dotramp</span></li>
          </ul>
        </section>

        <section id="resources" className="mb-10 scroll-mt-24">
          <SectionTitle id="resources">
            Resources
          </SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li><a href="https://polkadot.js.org/docs/" className="text-emerald-400" target="_blank" rel="noopener noreferrer">Polkadot.js Docs</a></li>
            <li><a href="https://developer.safaricom.co.ke/" className="text-emerald-400" target="_blank" rel="noopener noreferrer">Safaricom Daraja API</a></li>
            <li><a href="https://paseo.subscan.io/" className="text-emerald-400" target="_blank" rel="noopener noreferrer">Paseo Network</a></li>
            <li><a href="https://docs.substrate.io/" className="text-emerald-400" target="_blank" rel="noopener noreferrer">Substrate Docs</a></li>
          </ul>
        </section>

        <footer className="text-center pt-10 mt-10 border-t border-zinc-800 text-gray-500 text-xs">
          Made with <span className="text-red-400">♥</span> for the Polkadot ecosystem
        </footer>
      </main>
    </div>
  </div>
);

export default DeveloperDocs;
