import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import BottomNav from "../../components/BarraNav";


const { width: screenWidth } = Dimensions.get('window');

const carouselItems = [
  { title: 'Bicicleta', price: '$300.000', message: 'Estás a $50.000 de obtenerlo' },
  { title: 'Viaje',     price: '$1.500.000', message: 'Estás a $500.000 de obtenerlo' },
];

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const renderCarouselItem = (item: { title: string; price: string; message: string }) => (
    <View style={styles.carouselCard}>
      <Text style={styles.carouselTitle}>{item.title}</Text>
      <Text style={styles.carouselPrice}>{item.price}</Text>
      <Text style={styles.carouselMessage}>{item.message}</Text>
    </View>
  );

  const nextItem = () => setActiveIndex((prev) => (prev + 1) % carouselItems.length);
  const prevItem = () => setActiveIndex((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>Hola René</Text>
            <Text style={styles.headerSub}>Mi presupuesto</Text>
            <Text style={styles.headerAmount}>$1.000.000</Text>
            <Text style={styles.headerSub}>Mis gastos</Text>
            <Text style={styles.headerAmount}>$450.000</Text>
          </View>

          <View style={styles.optionsRow}>
            {/* Gestionar presupuesto (tu archivo actual es Presupueto.tsx) */}
            <Link href="/(tabs)/Presupueto" asChild>
              <TouchableOpacity style={styles.optionCard}>
                <Text style={styles.optionText}>Gestionar presupuesto</Text>
                <Ionicons name="chevron-forward" size={20} color="#4B0082" />
              </TouchableOpacity>
            </Link>

            {/* Wishlist dentro del grupo (tabs) */}
            <Link href="/(tabs)/WishList/wishlist" asChild>
              <TouchableOpacity style={styles.optionCard}>
                <Text style={styles.optionText}>Mi lista de deseos</Text>
                <Ionicons name="chevron-forward" size={20} color="#4B0082" />
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.carouselContainer}>
            {renderCarouselItem(carouselItems[activeIndex])}
            <View style={styles.carouselControls}>
              <TouchableOpacity onPress={prevItem}>
                <Ionicons name="chevron-back" size={18} color="black" />
              </TouchableOpacity>
              <Ionicons name="ellipse" size={10} color="black" style={{ marginHorizontal: 6 }} />
              <TouchableOpacity onPress={nextItem}>
                <Ionicons name="chevron-forward" size={18} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Espaciador para no tapar el contenido con la barra fija */}
          <View style={{ height: 72 }} />
        </View>
      </ScrollView>

      {/* Barra de navegación unificada */}
      <BottomNav active="home" />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#F8F8F8', justifyContent: 'space-between' },
  container: { flex: 1, alignItems: 'center', paddingVertical: 24, paddingBottom: 80 },
  headerBox: { backgroundColor: '#6418C3', borderRadius: 12, padding: 20, width: '90%', alignItems: 'center',  },
  headerTitle: { fontSize: 18, color: 'white', fontWeight: 'bold', textAlign: 'left', alignSelf: 'flex-start' },
  headerSub: { fontSize: 20, color: 'white', marginTop: 6 },
  headerAmount: { fontSize: 26, color: 'white', fontWeight: 'bold' },
  optionsRow: {
    flexDirection: screenWidth > 700 ? 'row' : 'column',
    width: '90%',
    justifyContent: 'space-between',
    marginVertical: 20,
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    
  },
  optionText: { fontSize: 20, color: '#4B0082' },
  carouselContainer: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 24, alignItems: 'center', elevation: 2 },
  carouselCard: { alignItems: 'center' },
  carouselTitle: { fontWeight: 'bold', fontSize: 20 },
  carouselPrice: { fontWeight: 'bold', fontSize: 26, marginTop: 4 },
  carouselMessage: { marginTop: 4, fontSize: 18, color: 'gray' },
  carouselControls: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
});
