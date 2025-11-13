"use client";

import React from "react";
import { Wallet, BookOpen, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/cjs/styles/prism";

const apiBase = "https://dotramp.com/api/v1";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "api", title: "DotRamp API Reference" },
  { id: "guides", title: "Guides & Tutorials" },
  { id: "polkadot-wallet", title: "Polkadot Wallet Integration" },
  { id: "js-api", title: "Polkadot JS API Reference" },
  { id: "best-practices", title: "API Best Practices" },
  { id: "community", title: "Community & Support" },
  { id: "resources", title: "Further Resources" }
];

const codeStyle = {
  borderRadius: "0.5rem",
  background: "#181824",
  fontSize: "1rem",
  padding: "1.25rem",
  margin: 0
};

const SectionTitle: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children
}) => (
  <h3
    id={id}
    className="text-lg font-semibold mb-3 text-emerald-400 flex items-center gap-2 scroll-mt-24"
  >
    <BookOpen className="w-5 h-5 text-emerald-400" />
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
  <div className="min-h-screen bg-black text-white flex flex-col">
    {/* Header */}
    <div className="border-b border-zinc-800 flex-shrink-0">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">DotRamp</h1>
        </div>
        <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-medium text-gray-400 cursor-default">
          <Wallet className="w-5 h-5" />
          Developer Docs
        </button>
      </div>
    </div>

    <div className="flex flex-1 w-full max-w-6xl mx-auto">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-black border-r border-zinc-800 py-8 px-4 sticky top-0 h-[calc(100vh-64px)]">
        <nav className="space-y-1">
          <div className="mb-4 uppercase text-xs text-gray-500 font-bold tracking-widest">
            Page Map
          </div>
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

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-16">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-400" />
          DotRamp Developer Hub
        </h2>

        {/* Introduction */}
        <section id="introduction" className="mb-10 scroll-mt-24">
          <p className="mb-4 text-gray-300">
            Welcome to the DotRamp Developer Hub.<br />
            Build, test, and launch instant onramp and offramp solutions for the Polkadot network using M-Pesa. This documentation includes official API references, usage guides, sample code, wallet integration, community resources, and more.
          </p>
        </section>

        {/* API Reference */}
        <section id="api" className="mb-10 scroll-mt-24">
          <SectionTitle id="api">DotRamp API Reference</SectionTitle>
          <p className="mb-3 text-gray-400">
            Integrate DOT, USDT, USDC, or DAI onramp/offramp with KES payments using the following endpoints.
          </p>

          <div className="mb-6">
            <b className="text-emerald-400">Authentication</b>
            <SyntaxHighlighter language="http" style={darcula} customStyle={codeStyle}>
{`Authorization: Bearer <YOUR_API_KEY>`}
            </SyntaxHighlighter>
          </div>

          <div className="mb-6">
            <b className="text-emerald-400">Get Live Token Rates</b>
            <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`GET ${apiBase}/rates`}
            </SyntaxHighlighter>
            <SyntaxHighlighter language="json" style={darcula} customStyle={codeStyle}>
{`{
  "DOT": 695.20,
  "USDT": 158.38,
  "USDC": 158.40,
  "DAI": 158.33
}`}
            </SyntaxHighlighter>
          </div>

          <div className="mb-6">
            <b className="text-emerald-400">Initiate M-Pesa Payment (STK Push)</b>
            <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`POST ${apiBase}/mpesa/stk-push`}
            </SyntaxHighlighter>
            <SyntaxHighlighter language="json" style={darcula} customStyle={codeStyle}>
{`{
  "amount": 1000,
  "phone": "254712345678"
}`}
            </SyntaxHighlighter>
          </div>

          <div className="mb-6">
            <b className="text-emerald-400">Check Payment Status</b>
            <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`GET ${apiBase}/mpesa/status?merchantRequestId=...`}
            </SyntaxHighlighter>
            <SyntaxHighlighter language="json" style={darcula} customStyle={codeStyle}>
{`{
  "status": "success" // or: "pending", "failed", "cancelled"
}`}
            </SyntaxHighlighter>
          </div>

          <div className="mb-6">
            <b className="text-emerald-400">Request Polkadot Payout</b>
            <SyntaxHighlighter language="bash" style={darcula} customStyle={codeStyle}>
{`POST ${apiBase}/payout`}
            </SyntaxHighlighter>
            <SyntaxHighlighter language="json" style={darcula} customStyle={codeStyle}>
{`{
  "address": "1zA4...asdf22",
  "amount": "3.000000",
  "token": "DOT"
}`}
            </SyntaxHighlighter>
          </div>

          <div className="mb-6">
            <b className="text-emerald-400">Error Handling</b>
            <SyntaxHighlighter language="json" style={darcula} customStyle={codeStyle}>
{`{
  "error": "Description of the error"
}`}
            </SyntaxHighlighter>
          </div>
        </section>

        {/* Guides & Tutorials */}
        <section id="guides" className="mb-10 scroll-mt-24">
          <SectionTitle id="guides">Guides & Tutorials</SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>
              <a href="https://docs.capa.fi/off-ramp" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                Off-ramp API workflow guide (Capa.fi)
              </a>
            </li>
            <li>
              <a href="https://polkadot.study/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                Build a Wallet with Polkadot.js & React (polkadot.study)
              </a>
            </li>
            <li>
              <a href="https://docs.cdp.coinbase.com/docs/onramp-offramp" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                General Onramp & Offramp Reference (Coinbase)
              </a>
            </li>
          </ul>
        </section>

        {/* Polkadot Wallet Integration */}
        <section id="polkadot-wallet" className="mb-10 scroll-mt-24">
          <SectionTitle id="polkadot-wallet">Polkadot Wallet Integration</SectionTitle>
          <p className="mb-3 text-gray-400">
            Integrate with Polkadot wallets using browser extensions like&nbsp;
            <a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Polkadot.js
            </a>
            ,
            <a href="https://talisman.xyz/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline ml-1">
              Talisman
            </a>
            , and
            <a href="https://subwallet.app/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline ml-1">
              Subwallet
            </a>. See each wallet’s documentation for API and UX integration tips.
          </p>
          <SyntaxHighlighter language="typescript" style={darcula} customStyle={codeStyle}>
{`// Enable extension
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';

const extensions = await web3Enable('YourApp');
const accounts = await web3Accounts();
console.log(accounts);`}
          </SyntaxHighlighter>
        </section>

        {/* Polkadot JS API */}
        <section id="js-api" className="mb-10 scroll-mt-24">
          <SectionTitle id="js-api">Polkadot JS API Reference</SectionTitle>
          <p className="mb-3 text-gray-400">
            Interact with any Polkadot SDK-based chain using <a href="https://polkadot.js.org/docs/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Polkadot.js API</a> for queries, transactions, and custom logic.
          </p>
          <SyntaxHighlighter language="javascript" style={darcula} customStyle={codeStyle}>
{`import { ApiPromise, WsProvider } from '@polkadot/api';

const provider = new WsProvider('wss://rpc.polkadot.io');
const api = await ApiPromise.create({ provider });

const nonce = await api.query.system.account('your-address-here');
console.log(nonce);`}
          </SyntaxHighlighter>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>
              <a href="https://docs.polkadot.com/overview" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                Polkadot Developer Docs
              </a>
            </li>
            <li>
              <a href="https://docs.polkadot.com/polkadot-js/api/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                polkadot/api Reference
              </a>
            </li>
          </ul>
        </section>

        {/* API Best Practices */}
        <section id="best-practices" className="mb-10 scroll-mt-24">
          <SectionTitle id="best-practices">API Best Practices</SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>
              Use nouns for resource URIs and leverage correct HTTP methods for action semantics&nbsp;
              (<a href="https://docuwriter.ai/blog/api-design-best-practices" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">View best practices</a>)
            </li>
            <li>
              Offer clear authentication docs with actionable code in multiple languages
            </li>
            <li>
              Always document error schema and include real payload examples
            </li>
            <li>
              Validate docs against live API behavior (see also: <a href="https://blockbee.io/blog/api-documentation-best-practices-2025" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">BlockBee API doc tips</a>)
            </li>
          </ul>
        </section>

        {/* Community & Support */}
        <section id="community" className="mb-10 scroll-mt-24">
          <SectionTitle id="community">Community & Support</SectionTitle>
          <p className="mb-3 text-gray-400">
            For further help or to find community-contributed solutions:
          </p>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>
              <a href="https://dotramp.com/developer" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">DotRamp Developer Portal</a>
            </li>
            <li>
              <a href="https://forum.polkadot.network/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Polkadot Forum</a>
            </li>
            <li>
              <a href="https://discord.gg/polkadot" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Polkadot Discord</a>
            </li>
            <li>
              See open source wallet, API, and onramp projects on GitHub: <a href="https://github.com/polkadot-js" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">polkadot-js</a>
            </li>
          </ul>
        </section>

        {/* Further Resources */}
        <section id="resources" className="mb-10 scroll-mt-24">
          <SectionTitle id="resources">Further Resources</SectionTitle>
          <ul className="list-disc ml-8 text-gray-300 space-y-2">
            <li>
              <a href="https://docs.polkadot.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Official Polkadot Documentation</a>
            </li>
            <li>
              <a href="https://docs.cdp.coinbase.com/docs/onramp-offramp" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Coinbase Onramp/Offramp</a>
            </li>
            <li>
              <a href="https://blockbee.io/blog/api-documentation-best-practices-2025" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Blockbee: API Documentation Best Practices</a>
            </li>
            <li>
              <a href="https://bitpace.com/blog/developer-friendly-crypto-payment-gateway-api" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Bitpace: Crypto API Gateway Docs</a>
            </li>
          </ul>
        </section>
      </main>
    </div>
  </div>
);

export default DeveloperDocs;
