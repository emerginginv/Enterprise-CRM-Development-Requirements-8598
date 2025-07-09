import React from 'react';
import {motion} from 'framer-motion';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {FiCheck, FiStar, FiCreditCard} = FiIcons;

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      amount: 9.99,
      priceId: "price_1RiRjvRWPtpjyF4hFGxGviw4",
      paymentLink: "https://buy.stripe.com/test_14A14p9md9Aj0mgarn7g400",
      currency: "usd",
      interval: "month",
      description: "Perfect for small businesses and startups",
      features: [
        "Up to 1,000 contacts",
        "Basic sales pipeline",
        "Task management",
        "Email integration",
        "Mobile access",
        "Standard support"
      ],
      highlight: false
    },
    {
      name: "Unlimited",
      amount: 14.99,
      priceId: "price_1RiRjvRWPtpjyF4hWY15YxRf",
      paymentLink: "https://buy.stripe.com/test_bJecN7cyp8wfed6arn7g401",
      currency: "usd",
      interval: "month",
      description: "Ideal for growing teams and businesses",
      features: [
        "Unlimited contacts",
        "Advanced pipeline management",
        "Custom reports & dashboards",
        "Sales forecasting",
        "Workflow automation",
        "Priority support",
        "Advanced integrations",
        "Team collaboration tools"
      ],
      highlight: true
    }
  ];

  const handlePlanClick = (paymentLink) => {
    window.open(paymentLink, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select the perfect plan for your business needs. All plans include a 14-day free trial.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <SafeIcon icon={FiStar} className="w-4 h-4" />
                  <span>Most Popular</span>
                </div>
              </div>
            )}
            
            <Card 
              hover 
              className={`h-full ${plan.highlight ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.amount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    /{plan.interval}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                    <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanClick(plan.paymentLink)}
                className="w-full"
                variant={plan.highlight ? 'primary' : 'outline'}
                icon={FiCreditCard}
              >
                Get Started
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                14-day free trial • No credit card required
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="text-center mt-12">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Need a Custom Solution?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            For enterprise needs or custom requirements, contact our sales team for a personalized quote.
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto mt-12">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Can I change plans anytime?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated automatically.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Is there a setup fee?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No setup fees. You only pay the monthly subscription fee for your chosen plan.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              What payment methods do you accept?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We accept all major credit cards including Visa, MasterCard, American Express, and Discover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;