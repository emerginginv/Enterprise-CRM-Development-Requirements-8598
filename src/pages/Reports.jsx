import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCRM } from '../context/CRMContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import ReactECharts from 'echarts-for-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiTrendingUp, 
  FiUsers, 
  FiDollarSign, 
  FiTarget,
  FiDownload,
  FiCalendar
} = FiIcons;

const Reports = () => {
  const { contacts, deals, tasks } = useCRM();
  const [dateRange, setDateRange] = useState('month');

  // Calculate metrics
  const totalRevenue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter(deal => deal.stage === 'closed-won');
  const lostDeals = deals.filter(deal => deal.stage === 'closed-lost');
  const activeDeals = deals.filter(deal => 
    deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
  );
  
  const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;
  const avgDealSize = deals.length > 0 ? totalRevenue / deals.length : 0;
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const taskCompletionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Sales Pipeline Chart
  const pipelineData = [
    { name: 'Lead', value: deals.filter(d => d.stage === 'lead').length },
    { name: 'Qualified', value: deals.filter(d => d.stage === 'qualified').length },
    { name: 'Proposal', value: deals.filter(d => d.stage === 'proposal').length },
    { name: 'Negotiation', value: deals.filter(d => d.stage === 'negotiation').length },
    { name: 'Closed Won', value: wonDeals.length },
    { name: 'Closed Lost', value: lostDeals.length },
  ];

  const pipelineOption = {
    title: {
      text: 'Sales Pipeline',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: pipelineData.map(item => item.name)
    },
    series: [
      {
        name: 'Pipeline',
        type: 'pie',
        radius: '50%',
        data: pipelineData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // Revenue Chart
  const revenueData = deals.map(deal => ({
    name: deal.name,
    value: deal.value,
    date: deal.createdAt
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  const revenueOption = {
    title: {
      text: 'Revenue Over Time',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}<br/>Revenue: $${params[0].value.toLocaleString()}`;
      }
    },
    xAxis: {
      type: 'category',
      data: revenueData.map(item => format(new Date(item.date), 'MMM dd'))
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [
      {
        data: revenueData.map(item => item.value),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(59, 130, 246, 0.5)'
            }, {
              offset: 1, color: 'rgba(59, 130, 246, 0.1)'
            }]
          }
        },
        lineStyle: {
          color: '#3B82F6'
        }
      }
    ]
  };

  // Contact Sources Chart
  const contactSources = contacts.reduce((acc, contact) => {
    acc[contact.source] = (acc[contact.source] || 0) + 1;
    return acc;
  }, {});

  const sourcesData = Object.entries(contactSources).map(([source, count]) => ({
    name: source,
    value: count
  }));

  const sourcesOption = {
    title: {
      text: 'Lead Sources',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: 'Sources',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: sourcesData
      }
    ]
  };

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-green-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: FiTarget,
      color: 'bg-blue-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Avg Deal Size',
      value: `$${Math.round(avgDealSize).toLocaleString()}`,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Task Completion',
      value: `${taskCompletionRate.toFixed(1)}%`,
      icon: FiUsers,
      color: 'bg-orange-500',
      change: '-2%',
      changeType: 'negative'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your sales performance and business metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="year">This year</option>
          </select>
          <Button
            icon={FiDownload}
            variant="outline"
          >
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      vs last period
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <SafeIcon icon={stat.icon} className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <ReactECharts option={pipelineOption} style={{ height: '400px' }} />
          </Card>
        </motion.div>

        {/* Lead Sources */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <ReactECharts option={sourcesOption} style={{ height: '400px' }} />
          </Card>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <ReactECharts option={revenueOption} style={{ height: '400px' }} />
        </Card>
      </motion.div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Summary
            </h3>
            <SafeIcon icon={FiCalendar} className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {contacts.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Contacts
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeDeals.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Active Deals
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {wonDeals.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Won Deals
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedTasks.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Completed Tasks
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;