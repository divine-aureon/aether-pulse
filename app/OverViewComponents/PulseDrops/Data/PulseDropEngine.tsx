"use client";

import { pulseDropRegistry } from "../../../OverViewComponents/PulseDrops/Data/pulseDropRegistry";
import { PULSE_DROP_IDS } from "../../../OverViewComponents/PulseDrops/Data/pulseDropIds"; // optional for direct ID checks
import { useMemo } from "react";
import { getGlobalDataState  } from "@/app/Global/store/globalStoreInstance";
import { useGlobalData } from "@/app/Global/GlobalData";
import { UserProfile } from "@/app/Global/BodySyncManifest";



export default function PulseDropEngine() {
      const userProfileSTORE = getGlobalDataState().userProfileSTORE;
    const userProfile = userProfileSTORE

const activeDrops = useMemo(() => {
  if (!userProfile || !userProfile.pulseSettings) return [];

  const { pulseSettings } = userProfile;

  return pulseDropRegistry.filter((drop) =>
    drop.condition(userProfile, pulseSettings)
  );
}, [userProfile]);

  return (
    <>
      {activeDrops.map((drop) => {
        const DropComponent = drop.component;
        return <DropComponent key={drop.id} />;
      })}
    </>
  );
}