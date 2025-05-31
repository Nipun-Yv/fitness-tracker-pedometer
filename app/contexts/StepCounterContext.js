// import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// import axios from 'axios';

// const API_BASE_URL = 'http://your-backend-url:3000/api';

// // interface StepCounterContextType {
// //   steps: number;
// //   isTracking: boolean;
// //   dailyGoal: number;
// //   startTracking: () => Promise<void>;
// //   stopTracking: () => Promise<void>;
// //   setDailyGoal: (goal: number) => void;
// // }

// const StepCounterContext = createContext(undefined);

// export const StepCounterProvider = ({ children }) => {
//   const [steps, setSteps] = useState(0);
//   const [isTracking, setIsTracking] = useState(false);
//   const [dailyGoal, setDailyGoalState] = useState(10000);
//   const intervalRef = useRef(null);
//   const sessionIdRef = useRef(null);

//   const startTracking = async () => {
//     try {
//       // Fetch current step count from database
//       const response = await axios.get(`${API_BASE_URL}/steps/current`);
//       setSteps(response.data.steps || 0);
      
//       // Create new session
//       const sessionResponse = await axios.post(`${API_BASE_URL}/steps/start-session`);
//       sessionIdRef.current = sessionResponse.data.sessionId;
      
//       setIsTracking(true);
      
//       // Start step simulation
//       intervalRef.current = setInterval(() => {
//         setSteps(prevSteps => {
//           const increment = Math.floor(Math.random() * 3) + 1; // 1-3 steps per interval
//           return prevSteps + increment;
//         });
//       }, 2000); // Update every 2 seconds
      
//     } catch (error) {
//       console.error('Failed to start tracking:', error);
//     }
//   };

//   const stopTracking = async () => {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
    
//     try {
//       // Save final step count to database
//       if (sessionIdRef.current) {
//         await axios.post(`${API_BASE_URL}/steps/end-session`, {
//           sessionId: sessionIdRef.current,
//           finalSteps: steps,
//         });
//       }
      
//       setIsTracking(false);
//       sessionIdRef.current = null;
//     } catch (error) {
//       console.error('Failed to stop tracking:', error);
//     }
//   };

//   const setDailyGoal = (goal) => {
//     setDailyGoalState(goal);
//   };

//   useEffect(() => {
//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//       }
//     };
//   }, []);

//   return (
//     <StepCounterContext.Provider value={{
//       steps,
//       isTracking,
//       dailyGoal,
//       startTracking,
//       stopTracking,
//       setDailyGoal,
//     }}>
//       {children}
//     </StepCounterContext.Provider>
//   );
// };

// export const useStepCounter = () => {
//   const context = useContext(StepCounterContext);
//   if (context === undefined) {
//     throw new Error('useStepCounter must be used within a StepCounterProvider');
//   }
//   return context;
// };
