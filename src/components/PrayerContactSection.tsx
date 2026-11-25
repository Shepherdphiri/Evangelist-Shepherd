import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Send } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  PrayerRequestType,
  VALIDATION_LIMITS,
  generateDocumentId,
  truncateText,
} from '../types/ministry';
import { postNeonAction } from '../lib/neonClient';
import { ABSTRACT_ART_PATH } from '../data/defaultMinistryData';
import { ResilientImage } from './ResilientImage';

const REQUEST_TYPES: PrayerRequestType[] = [
  'Prayer Request',
  'Inquiry',
  'Testimony',
  'General Message',
];

interface PrayerContactSectionProps {
  defaultSubject?: string;
  defaultType?: PrayerRequestType;
  useNeonDb?: boolean;
}

export function PrayerContactSection({
  defaultSubject = '',
  defaultType = 'Prayer Request',
  useNeonDb = false,
}: PrayerContactSectionProps) {
  const [requestType, setRequestType] = useState<PrayerRequestType>(defaultType);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    name: string;
    type: PrayerRequestType;
  } | null>(null);

  useEffect(() => {
    if (defaultSubject) setSubject(defaultSubject);
    if (defaultType) setRequestType(defaultType);
  }, [defaultSubject, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = truncateText(senderName, VALIDATION_LIMITS.prayer.senderNameMax);
    const cleanEmail = truncateText(senderEmail, VALIDATION_LIMITS.prayer.senderEmailMax);
    const cleanPhone = truncateText(senderPhone, VALIDATION_LIMITS.prayer.senderPhoneMax);
    const cleanSubject = truncateText(subject, VALIDATION_LIMITS.prayer.subjectMax);
    const cleanMessage = truncateText(message, VALIDATION_LIMITS.prayer.messageMax);

    if (cleanName.length < VALIDATION_LIMITS.prayer.senderNameMin) {
      setFormError('Please enter your name (at least 2 characters).');
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please provide a valid email address or leave the email field blank.');
      return;
    }
    if (cleanSubject.length < VALIDATION_LIMITS.prayer.subjectMin) {
      setFormError('Please enter a short subject for your message.');
      return;
    }
    if (cleanMessage.length < VALIDATION_LIMITS.prayer.messageMin) {
      setFormError('Please write your prayer request, faith question, or inquiry (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    const docId = generateDocumentId('req');
    const path = `prayer_requests/${docId}`;

    try {
      if (useNeonDb) {
        await postNeonAction('create_prayer_request', {
          senderName: cleanName,
          senderEmail: cleanEmail,
          senderPhone: cleanPhone,
          requestType,
          subject: cleanSubject,
          message: cleanMessage,
          isPrivate,
        });
      } else {
        await setDoc(doc(db, 'prayer_requests', docId), {
          senderName: cleanName,
          senderEmail: cleanEmail,
          senderPhone: cleanPhone,
          requestType,
          subject: cleanSubject,
          message: cleanMessage,
          isPrivate,
          status: 'unread',
          adminNote: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setSubmittedReceipt({ name: cleanName, type: requestType });
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setSubject('');
      setMessage('');
    } catch (error) {
      if (
        !useNeonDb &&
        error instanceof Error &&
        error.message.toLowerCase().includes('permission')
      ) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
      setFormError(
        'We could not submit your message right now. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
      <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
        <div className="space-y-3 text-center lg:text-left">
          <p className="text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
            Get In Touch
          </p>
          <h2 className="text-xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0D] leading-tight">
            Prayer Requests, Faith Questions &amp; Ministry Inquiries
          </h2>
          <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
            Whether you need personal prayer, have a sincere question about Christian faith, or want to invite Evangelist Shepherd for preaching or program collaboration, write directly below.
          </p>
        </div>

        <div className="aspect-[16/10] w-full overflow-hidden rounded-none border border-[#E4E4E7] bg-[#F4F4F5]">
          <ResilientImage
            src={ABSTRACT_ART_PATH}
            alt="Minimalist architectural geometry bathed in natural light"
            fallbackTitle="Prayer & Ministry Desk"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-none bg-white border border-[#E4E4E7] text-center sm:text-left">
            <p className="text-sm font-semibold text-[#0B0B0D]">Confidential Prayer</p>
            <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
              Sent directly to Evangelist Shepherd&rsquo;s private prayer desk.
            </p>
          </div>
          <div className="p-4 rounded-none bg-white border border-[#E4E4E7] text-center sm:text-left">
            <p className="text-sm font-semibold text-[#0B0B0D]">Faith Q&amp;A &amp; Events</p>
            <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
              Ask biblical questions or request a ministry visit.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-none p-5 sm:p-8 flex flex-col justify-center">
        {submittedReceipt ? (
          <div className="py-10 space-y-5 text-center max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-[#EEF2FF] text-[#2563EB]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B0B0D]">
              Message Received, {submittedReceipt.name}
            </h3>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Your {submittedReceipt.type.toLowerCase()} has been safely delivered to Evangelist Shepherd. May the peace of Christ guard your heart today.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSubmittedReceipt(null)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#0B0B0D] text-white hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#52525B] mb-2.5">
                Message Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REQUEST_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRequestType(type)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold border text-center transition-colors whitespace-nowrap truncate cursor-pointer ${
                      requestType === type
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-[#FAFAFA] text-[#0B0B0D] border-[#E4E4E7] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="prayer-name"
                  className="block text-sm font-medium text-[#0B0B0D] mb-1.5"
                >
                  Your Name <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  id="prayer-name"
                  type="text"
                  required
                  maxLength={VALIDATION_LIMITS.prayer.senderNameMax}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g., Grace M."
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label
                  htmlFor="prayer-email"
                  className="block text-sm font-medium text-[#0B0B0D] mb-1.5"
                >
                  Email Address (Optional)
                </label>
                <input
                  id="prayer-email"
                  type="email"
                  maxLength={VALIDATION_LIMITS.prayer.senderEmailMax}
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="prayer-phone"
                  className="block text-sm font-medium text-[#0B0B0D] mb-1.5"
                >
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  id="prayer-phone"
                  type="tel"
                  maxLength={VALIDATION_LIMITS.prayer.senderPhoneMax}
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+260 / +1 ..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label
                  htmlFor="prayer-subject"
                  className="block text-sm font-medium text-[#0B0B0D] mb-1.5"
                >
                  Subject <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  id="prayer-subject"
                  type="text"
                  required
                  maxLength={VALIDATION_LIMITS.prayer.subjectMax}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Prayer topic, faith question, or invitation"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="prayer-message"
                  className="block text-sm font-medium text-[#0B0B0D]"
                >
                  Your {requestType} <span className="text-[#2563EB]">*</span>
                </label>
                <span className="text-xs text-[#71717A] tabular-nums">
                  {message.length} / {VALIDATION_LIMITS.prayer.messageMax}
                </span>
              </div>
              <textarea
                id="prayer-message"
                required
                rows={5}
                maxLength={VALIDATION_LIMITS.prayer.messageMax}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your prayer request, question about faith, or ministry inquiry..."
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-[#E4E4E7] text-[#0B0B0D] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#2563EB] leading-relaxed"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="prayer-private"
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#2563EB] cursor-pointer"
              />
              <label
                htmlFor="prayer-private"
                className="text-xs text-[#52525B] leading-relaxed cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>
                  Keep strictly private for Evangelist Shepherd&rsquo;s personal prayer desk.
                </span>
              </label>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA]"
              >
                {formError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold text-white bg-[#0B0B0D] hover:bg-[#2563EB] disabled:opacity-60 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sending...' : `Send ${requestType}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
