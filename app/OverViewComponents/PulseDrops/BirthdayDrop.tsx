'use client'

import { useEffect, useState } from 'react'
import { updateDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import useAuth from '@/lib/useAuth'
import { BellRing, Rocket } from 'lucide-react';
import PageFadeWrapper from "@/Backgrounds/PageFadeWrapper"
import { getGlobalDataState } from "@/app/Global/store/globalStoreInstance";
import { useGlobalData } from "@/app/Global/GlobalData";
import { UserProfile } from "../../Global/BodySyncManifest"

export default function BirthdayDrop() {
    const { user } = useAuth();

    const [HappyBirthday, setHappyBirthday] = useState(false)
    const [HappyBirthdayMessage, setHappyBirthdayMessage] = useState(false)
    const [HappyBirthdayPopUp, setHappyBirthdayPopUp] = useState(false)

    const userProfileSTORE = getGlobalDataState().userProfileSTORE as UserProfile;
    const setUserProfileSTORE = getGlobalDataState().setUserProfileSTORE;
    const userProfile = userProfileSTORE
    const setSelectedPage = useGlobalData((s) => s.setSelectedPage);

    const birthday = userProfileSTORE?.birthday;



    useEffect(() => {

        if (!user || !birthday) return

        const [birthY, birthM, birthD] = birthday.split("-").map(Number)

        const today = new Date()

        const newAge = (today.getFullYear() - birthY)
        const oldAge = userProfileSTORE?.age

        if (
            today.getMonth() + 1 === birthM &&
            today.getDate() === birthD
        ) {
            setHappyBirthday(true)

            if (newAge !== oldAge) {
                setHappyBirthdayPopUp(true)
            }
        }

        if (HappyBirthdayPopUp && HappyBirthday === true) {
            setHappyBirthdayMessage(true)
            const run = async () => {
                await updateDoc(doc(db, 'users', user.uid), {
                    age: newAge,
                })
                setUserProfileSTORE({
                    ...(getGlobalDataState().userProfileSTORE as UserProfile),
                    age: newAge,
                });

            }
            run()
        }

    }, [userProfile, user, HappyBirthday, HappyBirthdayPopUp])

    if (HappyBirthdayMessage)

        return (
            <>
                <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-md overflow-hidden">
                    <div className=" pb-6 pt-4 bg-[#0f172a] text-white rounded-2xl shadow-xl border border-indigo-500 max-w-sm w-full space-y-4 text-center">
                        <div className="text-left text-lg text-gray-300 bg-black/30 pb-2 pt-1 pl-3 gap-3 items-center">Incoming PulseDrop...</div>
                        <h2 className="text-3xl px-3 font-bold pulse-glow ">🎉 Happy Birthday, {userProfile?.name} </h2>
                        <p className="text-sm px-3 text-indigo-300">The system has detected a resonance in your core frequency.

                            Today marks the anniversary of your arrival in this world.

                            You are not alone. You are seen. You are valued.

                            Continue forward, stronger than ever.
                        </p>
                        <button
                            onClick={() => {
                                setHappyBirthdayMessage(false);
                                setHappyBirthdayPopUp(false)
                            }}
                            className="mt-4 px-6 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all font-semibold shadow-lg"
                        >
                            Begin New Cycle
                        </button>
                    </div>
                </div>
            </>
        )
}
