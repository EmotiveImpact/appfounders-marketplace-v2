// Script to seed analytics data for testing
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Define schemas
const AnalyticsOverviewSchema = new mongoose.Schema({
  totalUsers: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  averageRating: { type: Number, required: true },
  conversionRate: { type: Number, required: true },
  activeUsers: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  developerId: { type: String, required: true, index: true }
});

const DailyVisitorSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  visitors: { type: Number, required: true },
  appId: { type: String, required: true, index: true },
  developerId: { type: String, required: true, index: true }
});

const AppPerformanceSchema = new mongoose.Schema({
  appId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  users: { type: Number, required: true },
  revenue: { type: Number, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  developerId: { type: String, required: true, index: true }
});

const PlatformDistributionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const RegionDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const MonthlyRevenueSchema = new mongoose.Schema({
  month: { type: String, required: true },
  revenue: { type: Number, required: true },
  year: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const FeedbackAnalyticsSchema = new mongoose.Schema({
  totalFeedback: { type: Number, required: true },
  averageRating: { type: Number, required: true },
  responseRate: { type: Number, required: true },
  resolutionRate: { type: Number, required: true },
  openIssues: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const RatingDistributionSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  count: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const FeedbackByCategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  count: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const FeedbackTrendSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  count: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const RatingTrendSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  rating: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

const ResponseTimeSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  hours: { type: Number, required: true },
  appId: { type: String, index: true },
  developerId: { type: String, required: true, index: true }
});

// Create models
const AnalyticsOverview = mongoose.models.AnalyticsOverview || 
  mongoose.model('AnalyticsOverview', AnalyticsOverviewSchema);

const DailyVisitor = mongoose.models.DailyVisitor || 
  mongoose.model('DailyVisitor', DailyVisitorSchema);

const AppPerformance = mongoose.models.AppPerformance || 
  mongoose.model('AppPerformance', AppPerformanceSchema);

const PlatformDistribution = mongoose.models.PlatformDistribution || 
  mongoose.model('PlatformDistribution', PlatformDistributionSchema);

const RegionData = mongoose.models.RegionData || 
  mongoose.model('RegionData', RegionDataSchema);

const MonthlyRevenue = mongoose.models.MonthlyRevenue || 
  mongoose.model('MonthlyRevenue', MonthlyRevenueSchema);

const FeedbackAnalytics = mongoose.models.FeedbackAnalytics || 
  mongoose.model('FeedbackAnalytics', FeedbackAnalyticsSchema);

const RatingDistribution = mongoose.models.RatingDistribution || 
  mongoose.model('RatingDistribution', RatingDistributionSchema);

const FeedbackByCategory = mongoose.models.FeedbackByCategory || 
  mongoose.model('FeedbackByCategory', FeedbackByCategorySchema);

const FeedbackTrend = mongoose.models.FeedbackTrend || 
  mongoose.model('FeedbackTrend', FeedbackTrendSchema);

const RatingTrend = mongoose.models.RatingTrend || 
  mongoose.model('RatingTrend', RatingTrendSchema);

const ResponseTime = mongoose.models.ResponseTime || 
  mongoose.model('ResponseTime', ResponseTimeSchema);

// Generate test data
const generateTestData = async () => {
  // Use a consistent developer ID for testing
  const developerId = 'dev_12345';
  
  // Generate app IDs
  const appIds = ['app_1', 'app_2', 'app_3', 'app_4'];
  const appNames = ['Fitness Tracker', 'Budget Planner', 'Recipe Manager', 'Task Organizer'];
  
  try {
    // Clear existing data
    await AnalyticsOverview.deleteMany({ developerId });
    await DailyVisitor.deleteMany({ developerId });
    await AppPerformance.deleteMany({ developerId });
    await PlatformDistribution.deleteMany({ developerId });
    await RegionData.deleteMany({ developerId });
    await MonthlyRevenue.deleteMany({ developerId });
    await FeedbackAnalytics.deleteMany({ developerId });
    await RatingDistribution.deleteMany({ developerId });
    await FeedbackByCategory.deleteMany({ developerId });
    await FeedbackTrend.deleteMany({ developerId });
    await RatingTrend.deleteMany({ developerId });
    await ResponseTime.deleteMany({ developerId });
    
    console.log('Cleared existing data');
    
    // Create analytics overview
    await AnalyticsOverview.create({
      totalUsers: 12580,
      totalRevenue: 48750.25,
      averageRating: 4.7,
      conversionRate: 3.2,
      activeUsers: 8420,
      date: new Date(),
      developerId
    });
    
    console.log('Created analytics overview');
    
    // Create daily visitors (last 30 days)
    const dailyVisitorsData = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create a daily visitor entry for each app
      for (const appId of appIds) {
        dailyVisitorsData.push({
          date,
          visitors: Math.floor(Math.random() * 200) + 300, // Random between 300-500
          appId,
          developerId
        });
      }
    }
    
    await DailyVisitor.insertMany(dailyVisitorsData);
    console.log('Created daily visitors data');
    
    // Create app performance data
    const appPerformanceData = appIds.map((appId, index) => ({
      appId,
      name: appNames[index],
      users: Math.floor(Math.random() * 3000) + 2000, // Random between 2000-5000
      revenue: Math.floor(Math.random() * 15000) + 5000, // Random between 5000-20000
      rating: (Math.random() * 1.5) + 3.5, // Random between 3.5-5.0
      date: new Date(),
      developerId
    }));
    
    await AppPerformance.insertMany(appPerformanceData);
    console.log('Created app performance data');
    
    // Create platform distribution
    const platformData = [
      { name: 'iOS', value: 58, date: new Date(), developerId },
      { name: 'Android', value: 42, date: new Date(), developerId }
    ];
    
    await PlatformDistribution.insertMany(platformData);
    console.log('Created platform distribution data');
    
    // Create region data
    const regionData = [
      { name: 'North America', value: 45, date: new Date(), developerId },
      { name: 'Europe', value: 30, date: new Date(), developerId },
      { name: 'Asia', value: 15, date: new Date(), developerId },
      { name: 'Other', value: 10, date: new Date(), developerId }
    ];
    
    await RegionData.insertMany(regionData);
    console.log('Created region data');
    
    // Create monthly revenue data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueData = months.map((month, index) => {
      const date = new Date(2025, index, 1);
      return {
        month,
        revenue: Math.floor(Math.random() * 4000) + 4000, // Random between 4000-8000
        year: 2025,
        date,
        developerId
      };
    });
    
    await MonthlyRevenue.insertMany(monthlyRevenueData);
    console.log('Created monthly revenue data');
    
    // Create feedback analytics data
    const feedbackAnalyticsData = [
      {
        totalFeedback: 1250,
        averageRating: 4.3,
        responseRate: 85,
        resolutionRate: 78,
        openIssues: 45,
        date: new Date(),
        developerId
      }
    ];
    
    // Also create app-specific feedback analytics
    for (const appId of appIds) {
      feedbackAnalyticsData.push({
        totalFeedback: Math.floor(Math.random() * 500) + 100,
        averageRating: (Math.random() * 1.5) + 3.5,
        responseRate: Math.floor(Math.random() * 20) + 75,
        resolutionRate: Math.floor(Math.random() * 20) + 70,
        openIssues: Math.floor(Math.random() * 30) + 5,
        date: new Date(),
        appId,
        developerId
      });
    }
    
    await FeedbackAnalytics.insertMany(feedbackAnalyticsData);
    console.log('Created feedback analytics data');
    
    // Create rating distribution
    const ratingDistributionData = [];
    for (let rating = 1; rating <= 5; rating++) {
      ratingDistributionData.push({
        rating,
        count: Math.floor(Math.random() * 100) + (rating * 50), // Higher ratings get more counts
        date: new Date(),
        developerId
      });
      
      // Also create app-specific rating distributions
      for (const appId of appIds) {
        ratingDistributionData.push({
          rating,
          count: Math.floor(Math.random() * 50) + (rating * 20),
          date: new Date(),
          appId,
          developerId
        });
      }
    }
    
    await RatingDistribution.insertMany(ratingDistributionData);
    console.log('Created rating distribution data');
    
    // Create feedback by category
    const categories = ['UI/UX', 'Performance', 'Features', 'Bugs', 'Other'];
    const feedbackByCategoryData = [];
    
    for (const category of categories) {
      feedbackByCategoryData.push({
        category,
        count: Math.floor(Math.random() * 100) + 50,
        date: new Date(),
        developerId
      });
      
      // Also create app-specific feedback by category
      for (const appId of appIds) {
        feedbackByCategoryData.push({
          category,
          count: Math.floor(Math.random() * 50) + 10,
          date: new Date(),
          appId,
          developerId
        });
      }
    }
    
    await FeedbackByCategory.insertMany(feedbackByCategoryData);
    console.log('Created feedback by category data');
    
    // Create feedback trend (last 30 days)
    const feedbackTrendData = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      feedbackTrendData.push({
        date,
        count: Math.floor(Math.random() * 20) + 10,
        developerId
      });
      
      // Also create app-specific feedback trends
      for (const appId of appIds) {
        feedbackTrendData.push({
          date,
          count: Math.floor(Math.random() * 10) + 1,
          appId,
          developerId
        });
      }
    }
    
    await FeedbackTrend.insertMany(feedbackTrendData);
    console.log('Created feedback trend data');
    
    // Create rating trend (last 30 days)
    const ratingTrendData = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      ratingTrendData.push({
        date,
        rating: 3.5 + (Math.random() * 1.5),
        developerId
      });
      
      // Also create app-specific rating trends
      for (const appId of appIds) {
        ratingTrendData.push({
          date,
          rating: 3.5 + (Math.random() * 1.5),
          appId,
          developerId
        });
      }
    }
    
    await RatingTrend.insertMany(ratingTrendData);
    console.log('Created rating trend data');
    
    // Create response time data
    const responseTimeData = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      responseTimeData.push({
        date,
        hours: Math.random() * 24,
        developerId
      });
      
      // Also create app-specific response times
      for (const appId of appIds) {
        responseTimeData.push({
          date,
          hours: Math.random() * 24,
          appId,
          developerId
        });
      }
    }
    
    await ResponseTime.insertMany(responseTimeData);
    console.log('Created response time data');
    
    console.log('Successfully seeded analytics data');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Run the script
const run = async () => {
  await connectToDatabase();
  await generateTestData();
  process.exit(0);
};

run();
