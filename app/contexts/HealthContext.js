// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const API_BASE_URL = 'http://your-backend-url:3000/api';

// // interface HealthMetrics {
// //   height: number;
// //   weight: number;
// //   calories_exerted: number;
// //   bmi?: number;
// // }

// // interface HealthContextType {
// //   healthMetrics: HealthMetrics;
// //   updateHealthMetrics: (metrics: Partial<HealthMetrics>) => Promise<void>;
// //   initializeHealthData: () => Promise<void>;
// //   loading: boolean;
// // }

// const HealthContext = createContext(undefined);

// export const HealthProvider = ({ children }) => {
//   const [healthMetrics, setHealthMetrics] = useState({
//     height: 0,
//     weight: 0,
//     calories_exerted: 0,
//   });
//   const [loading, setLoading] = useState(false);

//   const initializeHealthData = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/health/metrics`);
//       const data = response.data;
//       setHealthMetrics({
//         height: data.height || 0,
//         weight: data.weight || 0,
//         calories_exerted: data.calories_exerted || 0,
//         bmi: (data.height && data.weight ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1) : 0),
//       });
//     } catch (error) {
//       console.error('Failed to fetch health data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateHealthMetrics = async (metrics) => {
//     setLoading(true);
//     try {
//       const updatedMetrics = { ...healthMetrics, ...metrics };
//       if (updatedMetrics.height && updatedMetrics.weight) {
//         updatedMetrics.bmi = Number((updatedMetrics.weight / Math.pow(updatedMetrics.height / 100, 2)).toFixed(1));
//       }
      
//       await axios.put(`${API_BASE_URL}/health/metrics`, updatedMetrics);
//       setHealthMetrics(updatedMetrics);
//     } catch (error) {
//       console.error('Failed to update health data:', error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <HealthContext.Provider value={{
//       healthMetrics,
//       updateHealthMetrics,
//       initializeHealthData,
//       loading,
//     }}>
//       {children}
//     </HealthContext.Provider>
//   );
// };

// export const useHealth = () => {
//   const context = useContext(HealthContext);
//   if (context === undefined) {
//     throw new Error('useHealth must be used within a HealthProvider');
//   }
//   return context;
// };
