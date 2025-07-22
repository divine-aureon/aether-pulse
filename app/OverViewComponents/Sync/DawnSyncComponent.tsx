'use client';
import { getGlobalDataState } from "@/app/Global/store/globalStoreInstance";

import { useGlobalData } from "@/app/Global/GlobalData";
import type { UserProfile, SyncData } from "../../Global/BodySyncManifest"


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { calculateRecoveryFuel } from "@/lib/FusionCore";
import useAuth from '@/lib/useAuth';


export default function DawnSyncComponent() {

    const { user } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState("");
    const userProfileSTORE = getGlobalDataState().userProfileSTORE;
    const userProfile = userProfileSTORE

    const setLatestSyncSTORE = getGlobalDataState().setLatestSyncSTORE;
    const latestSyncSTORE = getGlobalDataState().latestSyncSTORE;

    const setSyncHistorySTORE = getGlobalDataState().setSyncHistorySTORE;
    const syncHistorySTORE = getGlobalDataState().syncHistorySTORE;

    const latestSync = latestSyncSTORE;

    const setSelectedPage = useGlobalData((s) => s.setSelectedPage);


    const [weight_lbs, setWeightLbs] = useState("");
    const [weight_kg, setWeightKg] = useState("");

    const preferredWeightUnit = userProfile?.preferredWeightUnit ?? "lbs";

    const [sleepQuality, setSleepQuality] = useState("");
    const [sleepDuration, setSleepDuration] = useState("");

    // 📅 Generate today's date string
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateString = `${yyyy}-${mm}-${dd}`;

    //QUARTER STRING
    const quarter = Math.floor((parseInt(mm) - 1) / 3) + 1;
    const quarterString = `Q${quarter}-${yyyy}`;

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        if (input === "") {
            setWeightLbs("");
            setWeightKg("");
            return;
        }

        const parsed = parseFloat(input);
        if (isNaN(parsed)) return; // Guard against nonsense

        if (preferredWeightUnit === "lbs") {
            setWeightLbs(parsed.toString());
            setWeightKg((parsed * 0.45).toString());
        } else {
            setWeightKg(parsed.toString());
            setWeightLbs((parsed * 2.20).toString());
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user?.uid) return;
            const { recoveryTDEE, recoveryMacros, vitamins, minerals } = calculateRecoveryFuel({
                weight_lbs,
                weight_kg,        // ← live state value
                height_cm: userProfile?.height_cm,
                gender: userProfile?.gender,
                age: userProfile?.age,
                calorieGoal: userProfile?.nutritionSettings?.calorieGoal
            });

            const userId = auth.currentUser!.uid;
            const userRef = doc(db, "users", user.uid);
            const quarterDocRef = doc(db, "users", userId, "syncs", quarterString);

            await setDoc(
                quarterDocRef,
                {
                    [dateString]: {
                        id: dateString,
                        quarterId: quarterString,

                        weight_lbs: Math.round(parseFloat(weight_lbs) * 100) / 100,
                        weight_kg: Math.round(parseFloat(weight_kg) * 100) / 100,
                        recoveryMacros,
                        vitamins,
                        minerals,
                        recoveryTDEE,
                        sleepQuality: parseFloat(sleepQuality) || null,
                        sleepDuration: parseFloat(sleepDuration) || null,
                        dawnSync: true,
                        dawnTimestamp: serverTimestamp(),

                        updatedAt: serverTimestamp(),
                        token: "manual",
                    }
                },
                { merge: true }
            );

            await setDoc(userRef, {
                lastKnownWeight_lbs: Math.round(parseFloat(weight_lbs) * 100) / 100,
                lastKnownWeight_kg: Math.round(parseFloat(weight_kg) * 100) / 100,
            }, { merge: true });


            const latest = getGlobalDataState().latestSyncSTORE;
            let latestHistory = null;
            let restOfHistory = {};

            if (syncHistorySTORE && syncHistorySTORE[dateString]) {
                latestHistory = syncHistorySTORE[dateString];
                const { [dateString]: _, ...rest } = syncHistorySTORE;
                restOfHistory = rest;
            }


            const isToday = latestSync?.id === dateString;

            if (isToday) {
                // ✅ Safe to merge into today's sync
                setLatestSyncSTORE({
                    ...latest,
                    id: dateString,
                    quarterId: quarterString,

                    weight_lbs: Math.round(parseFloat(weight_lbs) * 100) / 100,
                    weight_kg: Math.round(parseFloat(weight_kg) * 100) / 100,
                    recoveryMacros,
                    vitamins,
                    minerals,
                    recoveryTDEE,
                    sleepQuality: parseFloat(sleepQuality) || null,
                    sleepDuration: parseFloat(sleepDuration) || null,
                    dawnSync: true,
                    dawnTimestamp: serverTimestamp(),

                    updatedAt: serverTimestamp(),
                    token: "manual",
                });

                setSyncHistorySTORE({
                    ...restOfHistory,
                    [dateString as keyof typeof syncHistorySTORE]: {
                        ...latestHistory,
                        id: dateString,
                        quarterId: quarterString,

                        weight_lbs: Math.round(parseFloat(weight_lbs) * 100) / 100,
                        weight_kg: Math.round(parseFloat(weight_kg) * 100) / 100,
                        recoveryMacros,
                        vitamins,
                        minerals,
                        recoveryTDEE,
                        sleepQuality: parseFloat(sleepQuality) || null,
                        sleepDuration: parseFloat(sleepDuration) || null,
                        dawnSync: true,
                        dawnTimestamp: serverTimestamp(),

                        updatedAt: serverTimestamp(),
                        token: "manual",
                    }
                }
                );

            } else {
                // 🚨 Not today's sync — don't merge. Just create a new object.
                setLatestSyncSTORE({
                    id: dateString,
                    quarterId: quarterString,

                    weight_lbs: Math.round(parseFloat(weight_lbs) * 100) / 100,
                    weight_kg: Math.round(parseFloat(weight_kg) * 100) / 100,
                    recoveryMacros,
                    vitamins,
                    minerals,
                    recoveryTDEE,
                    sleepQuality: parseFloat(sleepQuality) || null,
                    sleepDuration: parseFloat(sleepDuration) || null,
                    dawnSync: true,
                    dawnTimestamp: serverTimestamp(),

                    updatedAt: serverTimestamp(),
                    token: "manual",
                });

                setSyncHistorySTORE({
                    ...syncHistorySTORE,
                    [dateString as keyof typeof syncHistorySTORE]: {
                        id: dateString,
                        quarterId: quarterString,

                        weight_lbs: Math.round(parseFloat(weight_lbs) * 100) / 100,
                        weight_kg: Math.round(parseFloat(weight_kg) * 100) / 100,
                        recoveryMacros,
                        vitamins,
                        minerals,
                        recoveryTDEE,
                        sleepQuality: parseFloat(sleepQuality) || null,
                        sleepDuration: parseFloat(sleepDuration) || null,
                        dawnSync: true,
                        dawnTimestamp: serverTimestamp(),

                        updatedAt: serverTimestamp(),
                        token: "manual",
                    }
                }
                );
            }



            setStatus("success");
        } catch (error) {
            setStatus("failure");
        }
    };



    useEffect(() => {
        if (status === "success") {

            const timeout = setTimeout(() => {
                //router.push('');
                setSelectedPage("bodysync");
            }, 0); // optional delay (1 second)

            return () => clearTimeout(timeout);
        }
    }, [status, router]);

    return (
        <div className="flex items-center justify-center flex-col pb-32">

            <div className="h-32 relative w-full bg-[url('/images/menus/dawn.jpg')] bg-cover bg-center bg-no-repeat rounded-2xl 
         text-white text-3xl glowing-button mb-2">
                <div className="absolute inset-0 pt-5 p-3 flex-col items-center bg-indigo-500/30 justify-center text-center rounded-xl">
                    <div className="text-center gap-2 pulse-glow ">Initiate DawnSync Protocol</div>
                    <h2 className="text-sm font-bold text-white">
                        Each morning is a chance to recalibrate. Enter your truth and proceed with clarity.
                    </h2>
                </div>

            </div>
            <div className="bg-white/20 w-full rounded-xl p-2 shadow-lg">
                <form onSubmit={handleSubmit} className="">
                    <p className="text-lg text-white font-semibold mb-1">
                        Weight ({preferredWeightUnit === "kg" ? "kg" : "lbs"})
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={preferredWeightUnit === "lbs" ? weight_lbs.toString() : weight_kg.toString()} onChange={handleWeightChange}
                            placeholder="Enter weight"
                            className="w-full p-3 mb-2 rounded bg-gray-800/70 text-white border-none focus:outline-none appearance-none"
                            required
                        />
                    </p>

                    <p className="text-lg text-white font-semibold mb-1">
                        Sleep Quality
                        <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="1-10"
                            onChange={(e) => setSleepQuality(e.target.value)}
                            className="w-full p-3 mb-2 rounded bg-gray-800/70 text-white border-none focus:outline-none appearance-none"
                            required
                        />
                    </p>

                    <p className="text-lg text-white font-semibold mb-1">
                        Sleep Duration (hours)
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Hours"
                            onChange={(e) => setSleepDuration(e.target.value)}
                            className="w-full p-3 mb-2 rounded bg-gray-800/70 text-white border-none focus:outline-none appearance-none"
                            required
                        />
                    </p>
                    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-center z-30">
                        <button
                            type="submit"
                            className="text-xl bg-white text-black px-2 py-3 w-full rounded-lg font-semibold glowing-button"
                        >
                            Sync Now!
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );

}