#!/bin/bash
# Download tennis draw PDFs from various federations
# Run from the reference directory: cd fixtures/reference && bash download-draws.sh

DEST="$(cd "$(dirname "$0")" && pwd)"
echo "Downloading to: $DEST"

# ============================================================
# STEP 1: Copy PDFs already cached by WebFetch (if they exist)
# ============================================================
CACHE="/Users/charlesallen/.claude/projects/-Users-charlesallen-Development-GitHub/bfe93b2d-1366-421a-b481-6c8141812c3f/tool-results"

copy_cached() {
    local src="$1" dst="$2"
    if [ -f "$CACHE/$src" ]; then
        cp "$CACHE/$src" "$DEST/$dst"
        echo "  [cached] $dst"
    fi
}

echo ""
echo "=== Copying from WebFetch cache ==="
# WTA Main Draws (Women's Singles)
copy_cached "webfetch-1774734910610-4n7o7v.pdf" "wta_ao_ws_2025.pdf"
copy_cached "webfetch-1774734911077-w2q03z.pdf" "wta_dubai_ws_2025.pdf"
copy_cached "webfetch-1774734911536-7myawx.pdf" "wta_brisbane_ws_2025.pdf"
copy_cached "webfetch-1774734948242-k4xwiq.pdf" "wta_madrid_ws_2025.pdf"
copy_cached "webfetch-1774734948676-tuvhah.pdf" "wta_rome_ws_2025.pdf"
copy_cached "webfetch-1774734949196-dj3o6z.pdf" "wta_hongkong_ws_2025.pdf"
copy_cached "webfetch-1774734950166-v3dyks.pdf" "wta_doha_ws_2025.pdf"
copy_cached "webfetch-1774734950629-mn0ir0.pdf" "wta_queens_ws_2025.pdf"
copy_cached "webfetch-1774734950979-nc7iol.pdf" "wta_eastbourne_ws_2025.pdf"

# WTA Qualifying
copy_cached "webfetch-1774734959743-ir6u3e.pdf" "wta_ao_qs_2025.pdf"
copy_cached "webfetch-1774734961159-05mh3w.pdf" "wta_dubai_qs_2025.pdf"

# WTA Finals
copy_cached "webfetch-1774734997643-kdar1u.pdf" "wta_finals_ws_2025.pdf"
copy_cached "webfetch-1774734998665-2i806j.pdf" "wta_finals_wd_2025.pdf"

# WTA Doubles
copy_cached "webfetch-1774734999485-i3vi7j.pdf" "wta_indianwells_wd_2025.pdf"

# ATP draws from protennislive
copy_cached "webfetch-1774734996538-30mkt6.pdf" "atp_finals_ms_2025.pdf"
copy_cached "webfetch-1774734997135-f5nlvj.pdf" "atp_finals_md_2025.pdf"
copy_cached "webfetch-1774735046572-8o9jb5.pdf" "atp_tour_ms_2025.pdf"
copy_cached "webfetch-1774735046745-8i7pqn.pdf" "atp_masters_ms_2025.pdf"
copy_cached "webfetch-1774735058337-1793lc.pdf" "atp_250_ms_2025.pdf"

# LTA draw templates
copy_cached "webfetch-1774734869718-gpqlax.pdf" "lta_32player_knockout_consolation.pdf"
copy_cached "webfetch-1774734870664-n1q3au.pdf" "lta_16player_compass.pdf"
copy_cached "webfetch-1774734871460-q5fs4l.pdf" "lta_8player_compass.pdf"

# French Open from perfect-tennis.com
copy_cached "webfetch-1774735057817-8q7qc3.pdf" "rg_ms_2025.pdf"

# AO men's singles from fogmountaintennis
copy_cached "webfetch-1774734983429-e7iprt.pdf" "ao_ms_2025.pdf"

# ============================================================
# STEP 2: Download PDFs directly (for URLs that weren't cached)
# ============================================================
echo ""
echo "=== Downloading from web ==="

dl() {
    local url="$1" name="$2"
    if [ -f "$DEST/$name" ]; then
        echo "  [skip] $name (already exists)"
        return
    fi
    if curl -sL -o "$DEST/$name" "$url" && file "$DEST/$name" | grep -q PDF; then
        echo "  [ok] $name"
    else
        echo "  [FAIL] $name ($url)"
        rm -f "$DEST/$name"
    fi
}

# --- WTA Main Draws (Women's Singles) ---
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/901/MDS.pdf"  "wta_ao_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/718/MDS.pdf"  "wta_dubai_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/800/MDS.pdf"  "wta_brisbane_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/1038/MDS.pdf" "wta_madrid_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/709/MDS.pdf"  "wta_rome_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/1074/MDS.pdf" "wta_hongkong_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/1003/MDS.pdf" "wta_doha_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/1111/MDS.pdf" "wta_queens_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/710/MDS.pdf"  "wta_eastbourne_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/1039/MDS.pdf" "wta_monterrey_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/808/MDS.pdf"  "wta_finals_ws_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/609/MDS.pdf"  "wta_indianwells_ws_2025.pdf"

# --- WTA Qualifying ---
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/901/QS.pdf"   "wta_ao_qs_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/718/QS.pdf"   "wta_dubai_qs_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/806/QS.pdf"   "wta_montreal_qs_2025.pdf"

# --- WTA Doubles ---
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/808/MDD.pdf"  "wta_finals_wd_2025.pdf"
dl "https://wtafiles.wtatennis.com/pdf/draws/2025/609/MDD.pdf"  "wta_indianwells_wd_2025.pdf"

# --- ATP draws from protennislive ---
dl "https://www.protennislive.com/posting/2025/605/mds.pdf"     "atp_finals_ms_2025.pdf"
dl "https://www.protennislive.com/posting/2025/605/mdd.pdf"     "atp_finals_md_2025.pdf"
dl "https://www.protennislive.com/posting/2025/7696/mds.pdf"    "atp_nextgen_ms_2025.pdf"
dl "https://www.protennislive.com/posting/2025/7696/mdd.pdf"    "atp_nextgen_md_2025.pdf"
dl "https://www.protennislive.com/posting/2025/747/mds.pdf"     "atp_tour_ms_2025.pdf"
dl "https://www.protennislive.com/posting/2025/328/mds.pdf"     "atp_masters_ms_2025.pdf"
dl "https://www.protennislive.com/posting/2025/444/mds.pdf"     "atp_250_ms_2025.pdf"

# --- Grand Slam official draws ---
# Wimbledon
dl "https://www.wimbledon.com/en_GB/scores/draws/2025_MS_draw.pdf" "wimbledon_ms_2025.pdf"
dl "https://www.wimbledon.com/en_GB/scores/draws/2025_LS_draw.pdf" "wimbledon_ws_2025.pdf"
dl "https://www.wimbledon.com/en_GB/scores/draws/2025_QS_draw.pdf" "wimbledon_mq_2025.pdf"
dl "https://www.wimbledon.com/en_GB/scores/draws/2025_BS_draw.pdf" "wimbledon_bs_2025.pdf"
dl "https://www.wimbledon.com/en_GB/scores/draws/2025_GS_draw.pdf" "wimbledon_gs_2025.pdf"
dl "https://www.wimbledon.com/en_GB/scores/draws/2025_RS_draw.pdf" "wimbledon_rs_2025.pdf"

# US Open
dl "https://www.usopen.org/en_US/scores/draws/2025_MS_draw.pdf" "usopen_ms_2025.pdf"
dl "https://www.usopen.org/en_US/scores/draws/2025_WS_draw.pdf" "usopen_ws_2025.pdf"
dl "https://www.usopen.org/en_US/scores/draws/2025_MQ_draw.pdf" "usopen_mq_2025.pdf"
dl "https://www.usopen.org/en_US/scores/draws/2025_WQ_draw.pdf" "usopen_wq_2025.pdf"
dl "https://www.usopen.org/en_US/scores/draws/2025_BS_draw.pdf" "usopen_bs_2025.pdf"
dl "https://www.usopen.org/en_US/scores/draws/2025_GS_draw.pdf" "usopen_gs_2025.pdf"

# Roland Garros (from perfect-tennis.com)
dl "https://www.perfect-tennis.com/wp-content/uploads/2025/05/french-open-draw-2025-mens.pdf" "rg_ms_2025.pdf"

# AO men's singles (from fogmountaintennis)
dl "https://fogmountaintennis.wordpress.com/wp-content/uploads/2025/01/ao-draw-ms.pdf" "ao_ms_2025.pdf"

# --- LTA draw templates ---
dl "https://www.lta.org.uk/4ac7ef/siteassets/about-lta/file/32-player-elimination-draw-with-consolation.pdf" "lta_32player_knockout_consolation.pdf"
dl "https://www.lta.org.uk/4ac7ef/siteassets/about-lta/file/16-player-compass-draw.pdf" "lta_16player_compass.pdf"
dl "https://www.lta.org.uk/4ac7ef/siteassets/about-lta/file/8-player-compass-draw.pdf" "lta_8player_compass.pdf"

# --- USTA draw template ---
dl "https://assets.usta.com/assets/1/15/CompassDraw%20Sheets.pdf" "usta_compass_draw_8player.pdf"

# ============================================================
echo ""
echo "=== Final inventory ==="
ls -1 "$DEST"/*.pdf | while read f; do
    name=$(basename "$f")
    size=$(wc -c < "$f" | tr -d ' ')
    printf "  %-50s %s bytes\n" "$name" "$size"
done
echo ""
echo "Total PDFs: $(ls "$DEST"/*.pdf | wc -l)"
