import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { backend } from '@/lib/backend';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_BODY = 10;

interface Props {
  visible: boolean;
  onClose: () => void;
  productId: string;
  handle: string;
}

function Field({ label, error, ...input }: TextInputProps & { label: string; error?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          input.multiline && styles.multiline,
          { textAlign: 'left' },
          { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
        ]}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function StarPicker({ rating, error, onChange }: { rating: number; error?: string; onChange: (rating: number) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label">{t('reviews.yourRating')}</AppText>
      <View style={styles.stars} accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 5, now: rating }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={t('reviews.stars', { count: star })}
            onPress={() => {
              haptics.select();
              onChange(star);
            }}
            style={styles.star}>
            <Icon name={rating >= star ? 'star' : 'star-outline'} size="lg" color={colors.primaryText} />
          </Pressable>
        ))}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/** Form fields and their validation; errors only show once the customer has tried to submit. */
function useReviewForm() {
  const { t } = useTranslation();
  const { customer } = useAuth();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(customer?.firstName ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    rating: rating === 0 ? t('reviews.errors.rating') : undefined,
    name: name.trim() ? undefined : t('reviews.errors.name'),
    email: EMAIL.test(email.trim()) ? undefined : t('reviews.errors.email'),
    body: body.trim().length >= MIN_BODY ? undefined : t('reviews.errors.body', { count: MIN_BODY }),
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);
  const review = { rating, name: name.trim(), email: email.trim(), title: title.trim() || undefined, body: body.trim() };

  return {
    fields: { rating, name, email, title, body },
    setters: { setRating, setName, setEmail, setTitle, setBody },
    shown,
    review,
    /** Marks the form as submitted and returns whether it can be sent. */
    attemptSubmit: () => {
      setSubmitted(true);
      return !Object.values(errors).some(Boolean);
    },
  };
}

export function WriteReviewSheet({ visible, onClose, productId, handle }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const showToast = useToast();
  const queryClient = useQueryClient();
  const form = useReviewForm();
  const { fields, setters, shown } = form;
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    if (!form.attemptSubmit()) return;
    setSending(true);
    setFailed(false);
    try {
      await backend.submitReview({ productId, handle, ...form.review });
      haptics.success();
      await queryClient.invalidateQueries({ queryKey: ['reviews', handle] });
      onClose();
      showToast({ message: t('reviews.thanks') });
    } catch {
      haptics.error();
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title={t('reviews.write')}
      onClose={onClose}
      footer={
        <>
          {failed ? (
            <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
              {t('reviews.errors.send')}
            </AppText>
          ) : null}
          <Button label={t('reviews.submit')} onPress={submit} loading={sending} />
        </>
      }>
      <StarPicker rating={fields.rating} error={shown('rating')} onChange={setters.setRating} />
      <Field label={t('reviews.name')} value={fields.name} onChangeText={setters.setName} autoComplete="name" error={shown('name')} />
      <Field
        label={t('reviews.email')}
        value={fields.email}
        onChangeText={setters.setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={shown('email')}
      />
      <Field label={t('reviews.titleLabel')} value={fields.title} onChangeText={setters.setTitle} maxLength={120} />
      <Field label={t('reviews.body')} value={fields.body} onChangeText={setters.setBody} multiline maxLength={5000} error={shown('body')} />
      <AppText variant="caption" muted>
        {t('reviews.moderation')}
      </AppText>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: { minHeight: minTouch, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 16 },
  multiline: { minHeight: 120, paddingTop: spacing.sm, textAlignVertical: 'top' },
  stars: { flexDirection: 'row' },
  star: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center' },
});
