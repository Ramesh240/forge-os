package com.forgeos.mastery.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ForgeSkeletonScreen
 *
 * High-fidelity branded startup screen for ForgeOS matching Next.js loading.tsx exactly.
 * Displays ForgeOS icon, ambient glow, title, and "INITIALIZING FLOW ARCHITECTURE..."
 * with an animated progress bar to ensure a seamless, single-screen loading experience.
 */
@Composable
fun ForgeSkeletonScreen(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "forge_loading_transition")

    // Animated progress bar offset moving back and forth across the track
    val progressOffsetFraction by infiniteTransition.animateFloat(
        initialValue = -0.3f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "progress_offset"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF060609)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Animated App Icon Shell with glassmorphism border and glow
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color(0x336366F1),
                                Color(0x1AA855F7),
                                Color.Transparent
                            )
                        )
                    )
                    .border(1.dp, Color(0x26FFFFFF), RoundedCornerShape(24.dp)),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0x4D6366F1)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "⚡",
                        fontSize = 20.sp,
                        color = Color(0xFF818CF8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Title: ForgeOS
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Forge",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFF4F4F5),
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = "OS",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF818CF8),
                    letterSpacing = (-0.5).sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Subtitle Tagline
            Text(
                text = "INITIALIZING FLOW ARCHITECTURE...",
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFA1A1AA),
                letterSpacing = 1.5.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Progress Bar Track
            Box(
                modifier = Modifier
                    .width(192.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color(0x14FFFFFF))
            ) {
                // Moving Progress Indicator
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(0.55f)
                        .offset(x = (192 * progressOffsetFraction).dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    Color(0xFF6366F1),
                                    Color(0xFFA855F7),
                                    Color(0xFF818CF8)
                                )
                            )
                        )
                )
            }
        }
    }
}

// Source: https://developer.android.com/develop/ui/compose/designsystems/material3
