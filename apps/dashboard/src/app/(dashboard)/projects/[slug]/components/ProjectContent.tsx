'use client';

import { ChatBubbleLeftIcon, UserGroupIcon, QuestionMarkCircleIcon, BellIcon } from '@heroicons/react/24/outline';

interface ProjectContentProps {
  activeTab: string;
}

export function ProjectContent({ activeTab }: ProjectContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'campaign':
        return (
          <div className="space-y-8">
            {/* Project Story Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">About this project</h2>
              <p className="text-gray-300 leading-relaxed text-lg mb-6">
                This is a revolutionary project that combines blockchain technology with real-world impact.
                Our mission is to democratize access to innovative investment opportunities while maintaining
                transparency and security for all participants.
              </p>

              {/* Project Learn More Section */}
              <div className="bg-zinc-900 rounded-xl p-8 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Learn about accountability on Pandoras</h3>
                <p className="text-gray-300 mb-4">
                    Questions about this project? <a href="#faq" className="text-lime-400 hover:underline">Check out the FAQ</a>
                </p>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  What is the minimum investment?
                </h3>
                <p className="text-gray-300">
                  The minimum investment is $100 USD. This allows more investors to participate in our project.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  When will the project launch?
                </h3>
                <p className="text-gray-300">
                  The project is expected to launch in Q1 2025, pending regulatory approval and final testing.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-lime-400" />
                  What are the risks involved?
                </h3>
                <p className="text-gray-300">
                  As with any investment, there are risks including market volatility and project execution risks.
                  Please read our full risk disclosure document.
                </p>
              </div>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Project Updates</h2>

            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BellIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Development Milestone Reached</h3>
                    <p className="text-gray-300 mb-2">
                      We&apos;ve successfully completed the alpha testing phase with excellent results.
                      The smart contracts are performing as expected.
                    </p>
                    <span className="text-sm text-gray-400">2 days ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BellIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Partnership Announcement</h3>
                    <p className="text-gray-300 mb-2">
                      Exciting news! We&apos;ve partnered with a leading DeFi protocol to enhance our platform&apos;s capabilities.
                    </p>
                    <span className="text-sm text-gray-400">1 week ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Comments & Discussion</h2>

            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold text-sm">JD</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">John Doe</span>
                      <span className="text-sm text-gray-400">3 hours ago</span>
                    </div>
                    <p className="text-gray-300">
                      This project looks very promising! The team seems experienced and the technology is cutting-edge.
                      Looking forward to the launch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold text-sm">SM</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">Sarah Miller</span>
                      <span className="text-sm text-gray-400">1 day ago</span>
                    </div>
                    <p className="text-gray-300">
                      Great to see the progress updates! The transparency is impressive.
                      How will the token distribution work?
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold text-sm">MR</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">Mike Rodriguez</span>
                      <span className="text-sm text-gray-400">2 days ago</span>
                    </div>
                    <p className="text-gray-300">
                      The FAQ section is very comprehensive. It addresses most of my concerns about the investment risks.
                      Well done!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Community</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-lime-400" />
                  Community Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Members</span>
                    <span className="text-white font-mono">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active This Week</span>
                    <span className="text-white font-mono">1,203</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Discussions</span>
                    <span className="text-white font-mono">156</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-lime-400">+12</span>
                    <span className="text-gray-400 ml-2">new members joined</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-blue-400">+8</span>
                    <span className="text-gray-400 ml-2">discussions started</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-purple-400">+45</span>
                    <span className="text-gray-400 ml-2">comments posted</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Community Guidelines</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Be respectful and constructive in discussions</li>
                <li>• Share relevant information and insights</li>
                <li>• Report any suspicious activity</li>
                <li>• Help new members understand the project</li>
                <li>• Follow our code of conduct at all times</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Content for {activeTab} will be available soon.</p>
          </div>
        );
    }
  };

  return renderContent();
}
