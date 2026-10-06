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

export function WriteReviewSheet({ visible, onClose, productId, handle }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { customer } = useAuth();
  const showToast = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(customer?.firstName ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const errors = {
    rating: rating === 0 ? t('reviews.errors.rating') : undefined,
    name: name.trim() ? undefined : t('reviews.errors.name'),
    email: EMAIL.test(email.trim()) ? undefined : t('reviews.errors.email'),
    body: body.trim().length >= MIN_BODY ? undefined : t('reviews.errors.body', { count: MIN_BODY }),
  };
  const shown = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  const submit = async () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    setSending(true);
    setFailed(false);
    try {
      await backend.submitReview({
        productId,
        handle,
        rating,
        name: name.trim(),
        email: email.trim(),
        title: title.trim() || undefined,
        body: body.trim(),
      });
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
                setRating(star);
              }}
              style={styles.star}>
              <Icon name={rating >= star ? 'star' : 'star-outline'} size="lg" color={colors.primaryText} />
            </Pressable>
          ))}
        </View>
        {shown('rating') ? (
          <AppText variant="caption" color={colors.danger}>
            {shown('rating')}
          </AppText>
        ) : null}
      </View>
      <Field label={t('reviews.name')} value={name} onChangeText={setName} autoComplete="name" error={shown('name')} />
      <Field
        label={t('reviews.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={shown('email')}
      />
      <Field label={t('reviews.titleLabel')} value={title} onChangeText={setTitle} maxLength={120} />
      <Field
        label={t('reviews.body')}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={5000}
        error={shown('body')}
      />
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
