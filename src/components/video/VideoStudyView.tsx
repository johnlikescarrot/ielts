import React, { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { ExternalLink, Film, ShieldCheck, Trash2 } from "lucide-react";
import { VideoClip } from "../../types";
import { useI18n } from "../../i18n/i18nContext";
import { storageService } from "../../storage/storageService";
import {
  createTimestampedVideoUrl,
  formatVideoTimestamp,
} from "../../video/videoStudy";

function providerLabel(provider: VideoClip["provider"]): string {
  return provider === "youtube" ? "YouTube" : "Bilibili";
}

export const VideoStudyView: React.FC = () => {
  const { t } = useI18n();
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [status, setStatus] = useState("");

  const loadClips = async () => {
    setClips(await storageService.getVideoClips());
  };

  useEffect(() => {
    void loadClips();
  }, []);

  const openClip = (clip: VideoClip) => {
    const url = createTimestampedVideoUrl(clip.sourceUrl, clip.startSeconds);
    if (typeof browser !== "undefined" && browser.tabs?.create) {
      void browser.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener");
    }
  };

  const removeClip = async (clip: VideoClip) => {
    await storageService.removeVideoClip(clip.id);
    await loadClips();
    setStatus(t("videoLab.delete"));
  };

  return (
    <VStack
      as="main"
      maxWidth={1200}
      gap={6}
      padding={6}
      aria-labelledby="video-lab-title"
    >
      <VStack gap={1}>
        <HStack gap={2} align="center">
          <Film aria-hidden="true" />
          <Heading level={1} id="video-lab-title">
            {t("videoLab.title")}
          </Heading>
        </HStack>
        <Text type="supporting" as="p">
          {t("videoLab.subtitle")}
        </Text>
      </VStack>

      <Card variant="muted" padding={4}>
        <HStack gap={3} align="center">
          <ShieldCheck aria-hidden="true" />
          <Text type="supporting" as="p">
            {t("videoLab.privacy")}
          </Text>
        </HStack>
      </Card>

      <HStack justify="between" align="center" wrap="wrap" gap={2}>
        <Heading level={2}>
          {t("videoLab.savedCount", { count: clips.length })}
        </Heading>
        <Token label="YouTube + Bilibili" color="blue" size="sm" />
      </HStack>

      {clips.length === 0 ? (
        <Card variant="muted" padding={5}>
          <VStack gap={2} align="start">
            <Heading level={3}>{t("videoLab.emptyTitle")}</Heading>
            <Text type="body" as="p">
              {t("videoLab.emptyDescription")}
            </Text>
          </VStack>
        </Card>
      ) : (
        <Grid columns={{ minWidth: 280, max: 3, repeat: "fit" }} gap={4}>
          {clips.map((clip) => {
            const start = formatVideoTimestamp(clip.startSeconds);
            const end = formatVideoTimestamp(clip.endSeconds);
            return (
              <Card key={clip.id} padding={4} elevation="low">
                <VStack gap={3} align="start">
                  <Token
                    label={providerLabel(clip.provider)}
                    color={clip.provider === "youtube" ? "red" : "pink"}
                    size="sm"
                  />
                  <Heading level={3} maxLines={2}>
                    {clip.sourceTitle}
                  </Heading>
                  <Text type="large" as="p" hasTabularNumbers>
                    {start} – {end}
                  </Text>
                  <Text type="supporting" as="p">
                    {t("videoLab.from", {
                      provider: providerLabel(clip.provider),
                    })}
                  </Text>
                  <HStack gap={2} wrap="wrap">
                    <Button
                      label={t("videoLab.open")}
                      variant="primary"
                      size="sm"
                      icon={<ExternalLink aria-hidden="true" size={14} />}
                      onClick={() => openClip(clip)}
                    />
                    <Button
                      label={t("videoLab.delete")}
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 aria-hidden="true" size={14} />}
                      onClick={() => void removeClip(clip)}
                    />
                  </HStack>
                </VStack>
              </Card>
            );
          })}
        </Grid>
      )}

      <Text type="supporting" as="p" aria-live="polite">
        {status}
      </Text>
    </VStack>
  );
};
