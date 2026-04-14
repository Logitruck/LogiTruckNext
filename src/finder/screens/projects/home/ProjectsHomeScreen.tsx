import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Project = {
  id: string;
  title: string;
  status: string;
};

const mockProjects: Project[] = [
  { id: '1', title: 'Miami → Orlando Route', status: 'Active' },
  { id: '2', title: 'Tampa Local Delivery', status: 'Pending' },
  { id: '3', title: 'Jacksonville Fleet Setup', status: 'Completed' },
];

const ProjectsHomeScreen = () => {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: Project }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate('ProjectDetails', {
          projectId: item.id,
        })
      }
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.status}>{item.status}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Projects</Text>

      <FlatList
        data={mockProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('ProjectSetup')}
      >
        <Text style={styles.fabText}>+ New Project</Text>
      </Pressable>
    </View>
  );
};

export default ProjectsHomeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0B0B0B',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  card: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  status: {
    marginTop: 6,
    color: '#A1A1AA',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
  },
  fabText: {
    color: 'white',
    fontWeight: 'bold',
  },
});