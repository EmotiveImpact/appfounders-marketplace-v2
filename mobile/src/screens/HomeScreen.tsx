import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AppCard } from '../components/AppCard';
import { SearchBar } from '../components/SearchBar';

const { width } = Dimensions.get('window');

interface App {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  category: string;
  developer: string;
  featured: boolean;
}

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [featuredApps, setFeaturedApps] = useState<App[]>([]);
  const [recentApps, setRecentApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load featured apps
      const featuredResponse = await apiService.getApps({ 
        featured: true, 
        limit: 5 
      });
      
      if (featuredResponse.success) {
        setFeaturedApps(featuredResponse.data);
      }

      // Load recent apps
      const recentResponse = await apiService.getApps({ 
        sort: 'created_at', 
        order: 'desc', 
        limit: 10 
      });
      
      if (recentResponse.success) {
        setRecentApps(recentResponse.data);
      }

      // Load categories
      const categoriesResponse = await apiService.get('/categories');
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }

    } catch (error) {
      console.error('Failed to load home data:', error);
      Alert.alert('Error', 'Failed to load apps. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    navigation.navigate('Search', { query });
  };

  const handleCategoryPress = (category: string) => {
    navigation.navigate('Category', { category });
  };

  const handleAppPress = (app: App) => {
    navigation.navigate('AppDetail', { appId: app.id });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>
            {isAuthenticated ? `Hello, ${user?.name}` : 'Welcome'}
          </Text>
          <Text style={styles.subtitle}>Discover amazing apps</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={32} color="#666" />
          )}
        </TouchableOpacity>
      </View>
      
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search apps..."
        style={styles.searchBar}
      />
    </View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFeaturedApps = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Apps</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Featured')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.appsContainer}
      >
        {featuredApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onPress={() => handleAppPress(app)}
            style={styles.featuredAppCard}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderRecentApps = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Added</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Recent')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.recentAppsGrid}>
        {recentApps.slice(0, 6).map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onPress={() => handleAppPress(app)}
            style={styles.recentAppCard}
            compact
          />
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderCategories()}
        {renderFeaturedApps()}
        {renderRecentApps()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchBar: {
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  seeAllText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingLeft: 20,
  },
  categoryCard: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  appsContainer: {
    paddingLeft: 20,
  },
  featuredAppCard: {
    width: width * 0.7,
    marginRight: 16,
  },
  recentAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  recentAppCard: {
    width: (width - 52) / 2,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen;
