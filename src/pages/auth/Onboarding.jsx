import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiArrowRight } = FiIcons;

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    company: '',
    industry: '',
    teamSize: '',
    goals: [],
    experience: ''
  });

  const questions = [
    {
      id: 'company',
      title: 'What\'s your company name?',
      type: 'text',
      placeholder: 'Enter your company name'
    },
    {
      id: 'industry',
      title: 'What industry are you in?',
      type: 'select',
      options: [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Retail',
        'Manufacturing',
        'Real Estate',
        'Consulting',
        'Other'
      ]
    },
    {
      id: 'teamSize',
      title: 'How many people are on your sales team?',
      type: 'select',
      options: [
        'Just me',
        '2-5 people',
        '6-10 people',
        '11-25 people',
        '26-50 people',
        '50+ people'
      ]
    },
    {
      id: 'goals',
      title: 'What are your main CRM goals?',
      type: 'multiple',
      options: [
        'Track leads and prospects',
        'Manage customer relationships',
        'Increase sales efficiency',
        'Generate reports and analytics',
        'Automate sales processes',
        'Improve team collaboration'
      ]
    },
    {
      id: 'experience',
      title: 'How experienced are you with CRM systems?',
      type: 'select',
      options: [
        'Complete beginner',
        'Some experience',
        'Experienced user',
        'Expert level'
      ]
    }
  ];

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleChoice = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId].includes(option)
        ? prev[questionId].filter(item => item !== option)
        : [...prev[questionId], option]
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    const currentAnswer = answers[currentQuestion.id];
    
    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      toast.error('Please provide an answer before continuing');
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Store onboarding data
    localStorage.setItem('crm_onboarding_data', JSON.stringify(answers));
    toast.success('Welcome to CRM Pro! Let\'s get started.');
    navigate('/');
  };

  const renderQuestion = (question) => {
    const answer = answers[question.id];
    
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
          />
        );
        
      case 'select':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(question.id, option)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  answer === option
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );
        
      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleMultipleChoice(question.id, option)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  answer.includes(option)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {answer.includes(option) && (
                    <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Branding Section */}
        <div className="hidden md:flex flex-col space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <SafeIcon icon={FiUser} className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CRM Pro
            </h1>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Let's Get Started!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Help us customize your experience by answering a few quick questions.
            </p>
          </div>
          
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{currentStep + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right: Onboarding Questions */}
        <Card className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentQuestion.title}
            </h3>
            {currentQuestion.type === 'multiple' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select all that apply
              </p>
            )}
          </div>
          
          <div className="mb-8">
            {renderQuestion(currentQuestion)}
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
            <Button 
              onClick={handleNext}
              icon={FiArrowRight}
              iconPosition="right"
            >
              {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;