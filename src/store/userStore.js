import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { database } from '../firebase_config/firebase'

export const useUserStore = create((set) => ({
    currentUser: null,
    isLoading: true,

    fetchUserInfo: async (uid) => {
        if (!uid)
        {
            return set({ currentUser: null, isLoading: false });
        }

        try
        {
            const docRef = doc(database, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists())
            {
                set({ currentUser: docSnap.data(), isLoading: false });
            }
            else
            {
                set({ currentUser: null, isLoading: false });
            }
        }
        catch (err)
        {
            console.error("Error fetching user info:", err);
            return set({ currentUser: null, isLoading: false });
        }
    }
}));
