import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { sosApi, toErrorMessage } from "@/lib/api";
import { toEmergencyContact } from "@/lib/adapters";
import type { SOSResponseDTO } from "@/types/api";
import type { EmergencyContact } from "@/types/user";

/** The share-ready payload the server builds for an SOS event. */
export interface SosDispatch {
  eventId: number;
  prefilledMessage: string;
  mapsLink: string;
  notifiedContacts: EmergencyContact[];
}

interface SosState {
  contacts: EmergencyContact[];
  contactsStatus: "idle" | "loading" | "ready" | "failed";
  sending: boolean;
  lastDispatch: SosDispatch | null;
  error: string | null;
}

const initialState: SosState = {
  contacts: [],
  contactsStatus: "idle",
  sending: false,
  lastDispatch: null,
  error: null
};

export const fetchContacts = createAsyncThunk<EmergencyContact[], void, { rejectValue: string }>(
  "sos/fetchContacts",
  async (_, { rejectWithValue }) => {
    try {
      return (await sosApi.listContacts()).map(toEmergencyContact);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const addContact = createAsyncThunk<
  EmergencyContact,
  { name: string; phoneNumber: string },
  { rejectValue: string }
>("sos/addContact", async (payload, { rejectWithValue }) => {
  try {
    const created = await sosApi.addContact({
      name: payload.name.trim(),
      phone_number: payload.phoneNumber.trim()
    });
    return toEmergencyContact(created);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const removeContact = createAsyncThunk<string, string, { rejectValue: string }>(
  "sos/removeContact",
  async (contactId, { rejectWithValue }) => {
    try {
      await sosApi.deleteContact(Number(contactId));
      return contactId;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export interface TriggerSosInput {
  latitude: number;
  longitude: number;
  tripId?: number | null;
  message?: string;
}

function toDispatch(dto: SOSResponseDTO): SosDispatch {
  return {
    eventId: dto.sos_event_id,
    prefilledMessage: dto.prefilled_message,
    mapsLink: dto.maps_link,
    notifiedContacts: dto.contacts.map(toEmergencyContact)
  };
}

export const triggerSos = createAsyncThunk<SosDispatch, TriggerSosInput, { rejectValue: string }>(
  "sos/trigger",
  async (input, { rejectWithValue }) => {
    try {
      const response = await sosApi.trigger({
        latitude: input.latitude,
        longitude: input.longitude,
        trip_id: input.tripId ?? null,
        message: input.message?.trim() || null
      });
      return toDispatch(response);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

const sosSlice = createSlice({
  name: "sos",
  initialState,
  reducers: {
    resetSos(state) {
      state.sending = false;
      state.lastDispatch = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.contactsStatus = "loading";
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contactsStatus = "ready";
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.contactsStatus = "failed";
        state.error = action.payload ?? "Could not load your emergency contacts.";
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.contacts.push(action.payload);
      })
      .addCase(addContact.rejected, (state, action) => {
        state.error = action.payload ?? "Could not add that contact.";
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter((c) => c.id !== action.payload);
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.error = action.payload ?? "Could not remove that contact.";
      })
      .addCase(triggerSos.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(triggerSos.fulfilled, (state, action) => {
        state.sending = false;
        state.lastDispatch = action.payload;
      })
      .addCase(triggerSos.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload ?? "Could not send your SOS.";
      });
  }
});

export const { resetSos } = sosSlice.actions;
export default sosSlice.reducer;
