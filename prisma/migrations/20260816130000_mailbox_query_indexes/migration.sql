-- Composite indexes for mailbox filtering / grant lookups

CREATE INDEX "messages_mailbox_id_direction_idx" ON "messages"("mailbox_id", "direction");
CREATE INDEX "messages_our_address_direction_idx" ON "messages"("our_address", "direction");
CREATE INDEX "mailbox_grants_user_id_mailbox_id_idx" ON "mailbox_grants"("user_id", "mailbox_id");
