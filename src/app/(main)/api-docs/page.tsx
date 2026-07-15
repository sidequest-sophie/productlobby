import { Metadata } from 'next';
import {
  Code2,
  Key,
  Zap,
  BookOpen,
  MessageSquare,
  Github,
  Copy,
  Check,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Build with ProductLobby. Comprehensive API documentation with examples, authentication, and SDKs.',
  openGraph: {
    title: 'API Documentation',
    description: 'Build with ProductLobby. Comprehensive API documentation with examples, authentication, and SDKs.',
    type: 'website',
  },
};

const MethodBadge = ({ method }: { method: 'GET' | 'POST' | 'PATCH' }) => {
  const colors = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PATCH: 'bg-amber-100 text-amber-700',
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-md font-semibold text-sm ${colors[method]}`}
    >
      {method}
    </span>
  );
};

const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
      <code>{code}</code>
    </div>
  );
};

const EndpointCard = ({
  method,
  path,
  title,
  description,
  example,
}: {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  title: string;
  description: string;
  example: string;
}) => {
  return (
    <div className="border border-slate-200 rounded-lg p-6 hover:border-violet-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MethodBadge method={method} />
            <code className="text-slate-700 font-mono text-sm bg-slate-100 px-3 py-1 rounded">
              {path}
            </code>
          </div>
          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        </div>
      </div>
      <p className="text-slate-600 mb-4">{description}</p>
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-semibold text-slate-700 mb-2">Example Response:</p>
        <CodeBlock code={example} language="json" />
      </div>
    </div>
  );
};

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">API Documentation</h1>
          <p className="text-xl md:text-2xl text-violet-100 mb-8">
            Build with ProductLobby
          </p>
          <p className="text-violet-100 max-w-2xl mx-auto mb-8">
            Everything you need to integrate ProductLobby into your application. Complete API reference with examples and SDKs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-semibold"
            >
              <Key className="w-5 h-5 mr-2" />
              Get API Key
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-violet-600"
            >
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Quick Start Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Quick Start</h2>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8">
            <p className="text-slate-700 mb-4">
              Get started with a simple API request using curl:
            </p>
            <CodeBlock
              code={`curl -X GET https://api.productlobby.com/campaigns \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
            />
            <p className="text-sm text-slate-600 mt-4">
              Replace <code className="bg-slate-200 px-2 py-1 rounded">YOUR_API_KEY</code> with your actual API key.
            </p>
          </div>
        </section>

        {/* Authentication Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Key className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Authentication</h2>
          </div>

          <div className="space-y-6">
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">API Key</h3>
              <p className="text-slate-700 mb-4">
                All API requests require an API key for authentication. Include your API key in the Authorization header:
              </p>
              <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Security</p>
                  <p className="text-amber-800 text-sm">
                    Never expose your API key in public repositories or client-side code. Use environment variables instead.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Getting Your API Key</h3>
              <ol className="space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="font-semibold text-violet-600 flex-shrink-0">1.</span>
                  <span>Sign in to your ProductLobby account</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-violet-600 flex-shrink-0">2.</span>
                  <span>Navigate to Settings → API Keys</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-violet-600 flex-shrink-0">3.</span>
                  <span>Click "Create New Key" and give it a name</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-violet-600 flex-shrink-0">4.</span>
                  <span>Copy the key and store it securely</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Endpoints Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Code2 className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">API Endpoints</h2>
          </div>

          {/* Campaigns */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b-2 border-lime-400">
              Campaigns
            </h3>
            <div className="space-y-6">
              <EndpointCard
                method="GET"
                path="/api/campaigns"
                title="List Campaigns"
                description="Retrieve all campaigns with pagination support. Use query parameters for filtering and sorting."
                example={`{
  "campaigns": [
    {
      "id": "camp_123",
      "title": "Mobile App Features",
      "status": "active",
      "contributionCount": 42,
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}`}
              />
              <EndpointCard
                method="GET"
                path="/api/campaigns/:id"
                title="Get Campaign Details"
                description="Retrieve detailed information about a specific campaign including contributions and stats."
                example={`{
  "id": "camp_123",
  "title": "Mobile App Features",
  "description": "Help shape the future...",
  "status": "active",
  "contributionCount": 42,
  "totalVotes": 156,
  "createdAt": "2026-02-01T10:00:00Z",
  "updatedAt": "2026-02-20T14:30:00Z"
}`}
              />
              <EndpointCard
                method="POST"
                path="/api/campaigns"
                title="Create Campaign"
                description="Create a new campaign. Requires authentication and appropriate permissions."
                example={`{
  "id": "camp_124",
  "title": "New Feature Campaign",
  "status": "draft",
  "createdAt": "2026-02-23T10:00:00Z"
}`}
              />
            </div>
          </div>

          {/* Users */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b-2 border-lime-400">
              Users
            </h3>
            <div className="space-y-6">
              <EndpointCard
                method="GET"
                path="/api/users/me"
                title="Get Current User"
                description="Retrieve information about the authenticated user including profile and preferences."
                example={`{
  "id": "user_456",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "company": "Acme Inc",
  "createdAt": "2025-06-15T08:30:00Z"
}`}
              />
              <EndpointCard
                method="PATCH"
                path="/api/users/me"
                title="Update Current User"
                description="Update your profile information such as name, company, and preferences."
                example={`{
  "id": "user_456",
  "email": "user@example.com",
  "name": "John Doe Updated",
  "company": "Acme Corp",
  "updatedAt": "2026-02-23T15:45:00Z"
}`}
              />
            </div>
          </div>

          {/* Contributions */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b-2 border-lime-400">
              Contributions
            </h3>
            <div className="space-y-6">
              <EndpointCard
                method="POST"
                path="/api/campaigns/:id/contribute"
                title="Add Contribution"
                description="Add a contribution (vote/comment) to a campaign. Users can contribute once per campaign."
                example={`{
  "id": "contrib_789",
  "campaignId": "camp_123",
  "userId": "user_456",
  "type": "vote",
  "createdAt": "2026-02-23T10:15:00Z"
}`}
              />
              <EndpointCard
                method="GET"
                path="/api/campaigns/:id/contributions"
                title="List Contributions"
                description="Retrieve all contributions for a specific campaign with pagination."
                example={`{
  "contributions": [
    {
      "id": "contrib_789",
      "campaignId": "camp_123",
      "user": {
        "id": "user_456",
        "name": "John Doe",
        "avatar": "https://..."
      },
      "type": "vote",
      "createdAt": "2026-02-23T10:15:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}`}
              />
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <AlertCircle className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Rate Limiting</h2>
          </div>

          <div className="border border-violet-200 bg-violet-50 rounded-lg p-6">
            <p className="text-slate-700 mb-4">
              API requests are rate limited to protect our infrastructure. Standard rate limits:
            </p>
            <div className="bg-white rounded-lg p-4 mb-4 border border-violet-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Requests per hour</span>
                <span className="text-2xl font-bold text-lime-600">1,000</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              When you exceed the rate limit, the API returns a <code className="bg-white px-2 py-1 rounded text-violet-600">429 Too Many Requests</code> response.
            </p>
            <p className="text-sm text-slate-600">
              Each response includes the following headers to help you track your usage:
            </p>
            <CodeBlock
              code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1645612800`}
            />
          </div>
        </section>

        {/* SDKs Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Official SDKs</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-lg p-6 hover:border-violet-300 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">JavaScript/TypeScript</h3>
              <p className="text-slate-600 text-sm mb-4">
                Full-featured SDK for Node.js and browser environments with TypeScript support.
              </p>
              <CodeBlock code={`npm install @productlobby/sdk`} />
              <Button
                variant="outline"
                className="w-full mt-4 border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                View Docs
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-violet-300 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Python</h3>
              <p className="text-slate-600 text-sm mb-4">
                Official Python package for easy integration with your Python applications.
              </p>
              <CodeBlock code={`pip install productlobby`} />
              <Button
                variant="outline"
                className="w-full mt-4 border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                View Docs
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-violet-300 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Ruby</h3>
              <p className="text-slate-600 text-sm mb-4">
                Idiomatic Ruby gem for seamless ProductLobby integration.
              </p>
              <CodeBlock code={`gem 'productlobby'`} />
              <Button
                variant="outline"
                className="w-full mt-4 border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                View Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Support & Community</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                Documentation
              </h3>
              <p className="text-slate-600 mb-4">
                Comprehensive guides and tutorials for integrating ProductLobby.
              </p>
              <Button
                variant="outline"
                className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                Read Docs
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                Community Support
              </h3>
              <p className="text-slate-600 mb-4">
                Ask questions and connect with other developers in our community.
              </p>
              <Button
                variant="outline"
                className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                Join Discord
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Github className="w-5 h-5 text-violet-600" />
                GitHub
              </h3>
              <p className="text-slate-600 mb-4">
                Open source examples, SDKs, and contributions welcome.
              </p>
              <Button
                variant="outline"
                className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                Visit GitHub
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                Status Page
              </h3>
              <p className="text-slate-600 mb-4">
                Check API status and uptime. Subscribe to updates.
              </p>
              <Button
                variant="outline"
                className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                Check Status
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-20 pt-12 border-t border-slate-200">
          <p className="text-center text-slate-600">
            Last updated: February 23, 2026 • API Version: 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
