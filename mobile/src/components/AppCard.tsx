import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  featured?: boolean;
}

interface AppCardProps {
  app: App;
  onPress: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ 
  app, 
  onPress, 
  style, 
  compact = false 
}) => {
  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <Ionicons name="star" size={12} color="#ffc107" />
      <Text style={styles.ratingText}>{app.rating.toFixed(1)}</Text>
      <Text style={styles.reviewCount}>({app.reviewCount})</Text>
    </View>
  );

  const renderPrice = () => (
    <View style={styles.priceContainer}>
      {app.discount > 0 ? (
        <>
          <Text style={styles.originalPrice}>${app.originalPrice}</Text>
          <Text style={styles.discountPrice}>${app.price}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{app.discount}% OFF</Text>
          </View>
        </>
      ) : (
        <Text style={styles.price}>${app.price}</Text>
      )}
    </View>
  );

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, style]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image source={{ uri: app.imageUrl }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {app.name}
          </Text>
          <Text style={styles.compactDeveloper} numberOfLines={1}>
            {app.developer}
          </Text>
          {renderRating()}
          {renderPrice()}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: app.imageUrl }} style={styles.image} />
        {app.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {app.discount > 0 && (
          <View style={styles.discountBadgeOverlay}>
            <Text style={styles.discountTextOverlay}>{app.discount}% OFF</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{app.category}</Text>
          {renderRating()}
        </View>
        
        <Text style={styles.title} numberOfLines={2}>
          {app.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {app.description}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.developer}>{app.developer}</Text>
          {renderPrice()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  compactImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  discountBadgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountTextOverlay: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  compactContent: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 10,
    color: '#6c757d',
    marginLeft: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  developer: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
  },
  compactDeveloper: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  originalPrice: {
    fontSize: 12,
    color: '#6c757d',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginRight: 4,
  },
  discountBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default AppCard;
