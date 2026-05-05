import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateMember } from './memberService';
import { logAction } from './auditService';
import { sendNotification } from './notificationService';
import { NOTIFICATION_TYPES } from '../rules/notificationRules';
import { safeTimestampToDate } from '../utils/formatters';

const PAYMENTS_COLLECTION = 'payments';

export const getPayments = async (orgId) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION), 
      where("organizationId", "==", orgId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => {
      const docData = doc.data();
      return { 
        id: doc.id, 
        ...docData,
        paidAt: docData.paidAt || docData.paymentDate
      };
    });

    // In-memory sorting to avoid composite index requirement
    return data.sort((a, b) => safeTimestampToDate(b.paymentDate || b.paidAt) - safeTimestampToDate(a.paymentDate || a.paidAt));
  } catch (error) {
    console.error("Error fetching payments:", error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      throw error; // Re-throw for UI handling
    }
    return [];
  }
};

export const recordPayment = async (orgId, memberData, paymentData, actor = null) => {
  if (!orgId) throw new Error("Organization ID is required");
  try {
    const now = new Date();
    const payload = {
      organizationId: orgId,
      memberId: memberData.memberId,
      memberDocId: memberData.id,
      fullName: memberData.fullName,
      amount: Number(paymentData.amount),
      method: paymentData.method,
      status: 'Paid',
      cardLast4: paymentData.cardLast4 || null,
      cardType: paymentData.cardType || null,
      paidAt: paymentData.date || now.toISOString(),
      paymentDate: paymentData.date || now.toISOString(),
      notes: paymentData.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), payload);

    const newTotal = (Number(memberData.totalPaid) || 0) + Number(paymentData.amount);
    
    await updateMember(memberData.id, {
      status: 'Active',
      paymentStatus: 'Paid',
      totalPaid: newTotal
    });

    if (actor) {
      await logAction(orgId, actor, 'RECORD_PAYMENT', 'payment', docRef.id, `Payment of $${paymentData.amount} for ${memberData.fullName}`);
    }
    
    await sendNotification(orgId, memberData.uid || memberData.id, NOTIFICATION_TYPES.PAYMENT_SUCCESS, { 
      amount: paymentData.amount 
    });
    
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error;
  }
};
