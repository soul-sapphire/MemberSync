import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const members = [
    {
        name: "John Silva",
        email: "john@test.com",
        phone: "+94771234567",
        plan: "Premium",
        status: "active",
        totalPaid: 120
    },
    {
        name: "Sarah Perera",
        email: "sarah@test.com",
        phone: "+94775555555",
        plan: "Standard",
        status: "active",
        totalPaid: 80
    },
    {
        name: "Ahmed Khan",
        email: "ahmed@test.com",
        phone: "+94774444444",
        plan: "Gold",
        status: "active",
        totalPaid: 200
    },
    {
        name: "Nimal Fernando",
        email: "nimal@test.com",
        phone: "+94770000000",
        plan: "Basic",
        status: "expired",
        totalPaid: 40
    }
];

export const seedMembers = async () => {
    for (const member of members) {
        await addDoc(collection(db, "members"), {
            ...member,
            createdAt: Timestamp.now()
        });
    }

    console.log("Members added successfully");
};