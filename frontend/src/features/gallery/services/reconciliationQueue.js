/**
 * Phase 36 — Reconciliation Queue Service
 *
 * When an image returned by Pinecone fails local resolution (e.g. file deleted
 * or moved on disk outside the app), this service queues and reconciles the state:
 *
 * 1. Marks status = 'missing' in local IndexedDB.
 * 2. Syncs availability status = 'missing' to cloud MongoDB & Pinecone via cloudSyncManager.
 * 3. Prevents duplicate reconciliation requests through an in-memory tracking set.
 */

import { setImageAvailability } from './galleryDb';
import { cloudSyncManager } from './cloudSync';

class ReconciliationQueue {
    constructor() {
        this.pendingQueue = new Map(); // imageId -> reason
        this.inFlight = new Set();
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
    }

    /**
     * Enqueue a failed image resolution for reconciliation.
     *
     * @param {string} imageId - Identifier of the broken image
     * @param {string} [reason='resolution_failed'] - Why resolution failed
     */
    queueFailedResolution(imageId, reason = 'resolution_failed') {
        if (!imageId || this.inFlight.has(imageId)) return;

        this.pendingQueue.set(imageId, reason);

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.processQueue();
        }, this.debounceDelay);
    }

    /**
     * Flushes the pending reconciliation queue immediately.
     */
    async processQueue() {
        if (this.pendingQueue.size === 0) return;

        const entries = Array.from(this.pendingQueue.entries());
        this.pendingQueue.clear();

        const updatesToSync = [];

        for (const [imageId, reason] of entries) {
            this.inFlight.add(imageId);
            try {
                // 1. Mark missing in local IndexedDB
                await setImageAvailability(imageId, 'missing');
                updatesToSync.push({ imageId, status: 'missing', reason });
                console.log(`[ReconciliationQueue] Marked ${imageId} as missing locally (${reason}).`);
            } catch (err) {
                console.warn(`[ReconciliationQueue] Failed to update local status for ${imageId}:`, err);
            }
        }

        // 2. Sync availability transitions to backend cloud (MongoDB + Pinecone deactivation)
        if (updatesToSync.length > 0) {
            try {
                await cloudSyncManager.syncAvailability(updatesToSync.map(u => ({
                    imageId: u.imageId,
                    status: 'missing'
                })));
                console.log(`[ReconciliationQueue] Synced ${updatesToSync.length} missing image(s) to cloud.`);
            } catch (syncErr) {
                console.warn('[ReconciliationQueue] Cloud availability sync deferred:', syncErr);
            } finally {
                for (const u of updatesToSync) {
                    this.inFlight.delete(u.imageId);
                }
            }
        }
    }

    /**
     * Returns true if an imageId is currently queued or in-flight.
     */
    isReconciling(imageId) {
        return this.pendingQueue.has(imageId) || this.inFlight.has(imageId);
    }
}

export const reconciliationQueue = new ReconciliationQueue();

