import { Metadata } from 'next';
import { Calendar, Video, Users, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Join our community events, webinars, and meetups',
};

interface Event {
  id: string;
  date: string;
  time: string;
  title: string;
  type: 'webinar' | 'meetup' | 'workshop';
  description: string;
  location?: string;
  attendees?: number;
  link?: string;
}

const upcomingEvents: Event[] = [
  {
    id: '1',
    date: 'March 12, 2026',
    time: '2:00 PM EST',
    title: 'Product Strategy in 2026: AI-Powered Features',
    type: 'webinar',
    description: 'Learn how top product teams are leveraging AI to enhance their product roadmaps and deliver better user experiences.',
    attendees: 342,
    link: '#',
  },
  {
    id: '2',
    date: 'March 18, 2026',
    time: '6:00 PM EST',
    title: 'San Francisco Product Meetup',
    type: 'meetup',
    description: 'Connect with local product managers and discuss the latest trends in product development. Network with peers over drinks and appetizers.',
    location: 'SoMa District, San Francisco, CA',
    attendees: 87,
    link: '#',
  },
  {
    id: '3',
    date: 'March 25, 2026',
    time: '10:00 AM EST',
    title: 'User Research Fundamentals Workshop',
    type: 'workshop',
    description: 'A hands-on workshop covering essential user research techniques, data collection methods, and analysis frameworks.',
    attendees: 156,
    link: '#',
  },
  {
    id: '4',
    date: 'April 2, 2026',
    time: '1:00 PM EST',
    title: 'Metrics That Matter: Measuring Product Success',
    type: 'webinar',
    description: 'Discover the key metrics that drive product decisions and learn how to track them effectively across your organization.',
    attendees: 289,
    link: '#',
  },
  {
    id: '5',
    date: 'April 9, 2026',
    time: '7:00 PM EST',
    title: 'New York Product Leaders Networking Event',
    type: 'meetup',
    description: 'An intimate gathering of product leaders in NYC to discuss challenges, share insights, and build meaningful connections.',
    location: 'Midtown Manhattan, New York, NY',
    attendees: 64,
    link: '#',
  },
  {
    id: '6',
    date: 'April 15, 2026',
    time: '9:00 AM EST',
    title: 'Design Thinking & Product Innovation',
    type: 'workshop',
    description: 'Master design thinking principles and learn how to apply them to solve complex product challenges and innovate faster.',
    attendees: 201,
    link: '#',
  },
  {
    id: '7',
    date: 'May 1, 2026',
    time: '2:00 PM EST',
    title: 'Building Resilient Product Teams',
    type: 'webinar',
    description: 'Explore strategies for building and maintaining high-performing product teams in times of change and uncertainty.',
    attendees: 267,
    link: '#',
  },
  {
    id: '8',
    date: 'May 10, 2026',
    time: '6:30 PM EST',
    title: 'Austin Tech Community Summit',
    type: 'meetup',
    description: 'Join the vibrant Austin tech community for a full evening of networking, product talks, and innovation discussions.',
    location: 'Downtown Austin, TX',
    attendees: 112,
    link: '#',
  },
];

const pastEvents: Event[] = [
  {
    id: 'p1',
    date: 'February 20, 2026',
    time: '2:00 PM EST',
    title: 'Data-Driven Decision Making',
    type: 'webinar',
    description: 'How to leverage data to make better product decisions.',
    attendees: 412,
  },
  {
    id: 'p2',
    date: 'February 14, 2026',
    time: '6:00 PM EST',
    title: 'Boston Product Meetup',
    type: 'meetup',
    description: 'February gathering of Boston product professionals.',
    location: 'Back Bay, Boston, MA',
    attendees: 95,
  },
];

const typeConfig: Record<'webinar' | 'meetup' | 'workshop', { color: string; icon: React.ReactNode; label: string }> = {
  webinar: {
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: <Video className="w-4 h-4" />,
    label: 'Webinar',
  },
  meetup: {
    color: 'bg-lime-100 text-lime-700 border-lime-200',
    icon: <Users className="w-4 h-4" />,
    label: 'Meetup',
  },
  workshop: {
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: <Calendar className="w-4 h-4" />,
    label: 'Workshop',
  },
};

function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  const config = typeConfig[event.type];

  return (
    <div className={`border rounded-lg p-6 transition-all ${isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-md'}`}>
      <div className="flex flex-col gap-4">
        {/* Header with date and type badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5 text-violet-600" />
              <div>
                <div className="font-semibold text-gray-900">{event.date}</div>
                <div className="text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </div>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
            {config.icon}
            {config.label}
          </div>
        </div>

        {/* Title and description */}
        <div>
          <h3 className={`font-bold text-lg mb-2 ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>{event.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
        </div>

        {/* Location or attendees */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-violet-600" />
              {event.location}
            </div>
          )}
          {event.attendees && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-lime-600" />
              {event.attendees} attending
            </div>
          )}
        </div>

        {/* Action button */}
        {!isPast && event.link && (
          <a href={event.link} target="_blank" rel="noopener noreferrer" className="block w-full mt-2">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Register Now
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        )}
        {isPast && (
          <div className="text-sm text-gray-500 font-medium">Event completed</div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-violet-600 to-violet-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">Community Events</h1>
          </div>
          <p className="text-lg text-violet-100 max-w-2xl mx-auto">
            Join ProductLobby events to connect with product leaders, learn from experts, and grow your skills with our community.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Upcoming Events */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="w-6 h-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
          </div>

          <div className="grid gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        {/* Past Events Section */}
        <section className="mb-16">
          <details className="group">
            <summary className="flex items-center gap-3 cursor-pointer mb-6">
              <Calendar className="w-6 h-6 text-gray-400" />
              <h2 className="text-3xl font-bold text-gray-900">Past Events</h2>
              <span className="text-gray-500 group-open:hidden">({pastEvents.length})</span>
            </summary>

            <div className="grid gap-6 mt-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} isPast={true} />
              ))}
            </div>
          </details>
        </section>

        {/* Host an Event CTA */}
        <section className="bg-gradient-to-r from-lime-50 to-violet-50 rounded-lg border border-violet-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Want to Host an Event?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            ProductLobby is always looking for community members to host webinars, meetups, and workshops. Share your expertise and connect with our vibrant community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              Propose an Event
            </Button>
            <Button variant="outline" className="border-violet-200 text-violet-600 hover:bg-violet-50">
              Learn More
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
